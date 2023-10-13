/*
 * Copyright (c) 2018-2023 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { TextContent } from '@patternfly/react-core';
import { load } from 'js-yaml';
import React from 'react';

import DevfileViewer from '@/components/DevfileViewer';
import EditorTools from '@/components/EditorTools';
import styles from '@/pages/WorkspaceDetails/DevfileEditorTab/index.module.css';
import { DevfileAdapter } from '@/services/devfile/adapter';
import devfileApi from '@/services/devfileApi';
import stringify from '@/services/helpers/editor';
import { Workspace } from '@/services/workspace-adapter';
import {
  DEVWORKSPACE_DEVFILE,
  DEVWORKSPACE_METADATA_ANNOTATION,
} from '@/services/workspace-client/devworkspace/devWorkspaceClient';

export type Props = {
  workspace: Workspace;
  isActive: boolean;
};

export type State = {
  isExpanded: boolean;
  copied?: boolean;
};

export class DevfileEditorTab extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isExpanded: false,
    };
  }

  public render(): React.ReactElement {
    const { isExpanded } = this.state;
    const editorTabStyle = isExpanded ? styles.editorTabExpanded : styles.editorTab;

    let originDevfileStr = this.props.workspace.ref.metadata?.annotations?.[DEVWORKSPACE_DEVFILE];
    if (!originDevfileStr) {
      originDevfileStr = stringify(this.props.workspace.devfile);
    }
    const devfile = load(originDevfileStr) as devfileApi.Devfile;
    const attrs = DevfileAdapter.getAttributesFromDevfileV2(devfile);
    if (attrs?.[DEVWORKSPACE_METADATA_ANNOTATION]) {
      delete attrs[DEVWORKSPACE_METADATA_ANNOTATION];
      if (Object.keys(attrs).length === 0) {
        delete devfile.attributes;
        delete devfile.metadata.attributes;
      }
      originDevfileStr = stringify(devfile);
    }

    return (
      <React.Fragment>
        <br />
        <TextContent className={editorTabStyle}>
          <EditorTools
            devfileOrDevWorkspace={devfile}
            handleExpand={isExpanded => {
              this.setState({ isExpanded });
            }}
          />
          <DevfileViewer
            isActive={this.props.isActive}
            isExpanded={isExpanded}
            value={originDevfileStr}
            id="devfileViewerId"
          />
        </TextContent>
      </React.Fragment>
    );
  }
}

export default DevfileEditorTab;
