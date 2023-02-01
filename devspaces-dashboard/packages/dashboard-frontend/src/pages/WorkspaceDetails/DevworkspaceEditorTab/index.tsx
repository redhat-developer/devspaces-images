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

import React from 'react';
import { TextContent } from '@patternfly/react-core';
import DevworkspaceEditor from '../../../components/WorkspaceEditor';
import EditorTools from '../../../components/EditorTools';
import { Workspace } from '../../../services/workspace-adapter';

import styles from './index.module.css';

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

    return (
      <>
        <br />
        <TextContent className={editorTabStyle}>
          <EditorTools
            content={workspace.ref}
            handleExpand={isExpanded => {
              this.setState({ isExpanded });
            }}
          />
          <DevworkspaceEditor workspace={workspace.ref} isActive={this.props.isActive} />
        </TextContent>
      </>
    );
  }
}

export default DevworkspaceEditorTab;
