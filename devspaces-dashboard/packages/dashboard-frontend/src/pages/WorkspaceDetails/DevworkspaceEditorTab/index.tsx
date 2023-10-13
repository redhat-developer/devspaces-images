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
import { dump } from 'js-yaml';
import React from 'react';

import DevfileViewer from '@/components/DevfileViewer';
import EditorTools from '@/components/EditorTools';
import styles from '@/pages/WorkspaceDetails/DevworkspaceEditorTab/index.module.css';
import { Workspace } from '@/services/workspace-adapter';

export type Props = {
  workspace: Workspace;
  isActive: boolean;
};

export type State = {
  isExpanded: boolean;
  copied?: boolean;
};

export class DevworkspaceEditorTab extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isExpanded: false,
    };
  }

  public render(): React.ReactElement {
    const { isExpanded } = this.state;
    const { workspace } = this.props;
    const editorTabStyle = isExpanded ? styles.editorTabExpanded : styles.editorTab;
    const devWorkspaceStr = dump(workspace.ref);

    return (
      <>
        <br />
        <TextContent className={editorTabStyle}>
          <EditorTools
            devfileOrDevWorkspace={workspace.ref}
            handleExpand={isExpanded => {
              this.setState({ isExpanded });
            }}
          />
          <DevfileViewer
            isActive={this.props.isActive}
            isExpanded={isExpanded}
            value={devWorkspaceStr}
            id="devWorkspaceViewerId"
          />
        </TextContent>
      </>
    );
  }
}

export default DevworkspaceEditorTab;
