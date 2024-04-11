/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
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

import { DevfileViewer } from '@/components/DevfileViewer';
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

    const devfile = prepareDevfile(this.props.workspace);
    const devfileStr = stringify(devfile);

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
            value={devfileStr}
            id="devfileViewerId"
          />
        </TextContent>
      </React.Fragment>
    );
  }
}

export function prepareDevfile(workspace: Workspace): devfileApi.Devfile {
  const devfileStr = workspace.ref.metadata?.annotations?.[DEVWORKSPACE_DEVFILE];
  const devfile = devfileStr ? (load(devfileStr) as devfileApi.Devfile) : workspace.devfile;

  const attrs = DevfileAdapter.getAttributes(devfile);
  if (attrs?.[DEVWORKSPACE_METADATA_ANNOTATION]) {
    delete attrs[DEVWORKSPACE_METADATA_ANNOTATION];
  }
  if (Object.keys(attrs).length === 0) {
    delete devfile.attributes;
    delete devfile.metadata.attributes;
  }

  return devfile;
}
