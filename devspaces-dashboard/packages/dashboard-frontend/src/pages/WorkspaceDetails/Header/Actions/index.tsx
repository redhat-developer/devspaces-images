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

import React from 'react';

import { WorkspaceActionsConsumer } from '@/contexts/WorkspaceActions';
import { WorkspaceActionsDeleteButton } from '@/contexts/WorkspaceActions/DeleteButton';
import { WorkspaceActionsDropdown } from '@/contexts/WorkspaceActions/Dropdown';
import { Workspace } from '@/services/workspace-adapter';

type Props = {
  workspace: Workspace;
};

export class WorkspaceDetailsHeaderActions extends React.PureComponent<Props> {
  constructor(props: Props) {
    super(props);
  }

  render(): React.ReactNode {
    const { workspace } = this.props;

    return (
      <WorkspaceActionsConsumer>
        {context => {
          if (workspace.status === 'Deprecated') {
            return (
              <WorkspaceActionsDeleteButton
                context={context}
                workspace={this.props.workspace}
                onAction={async () => {
                  // no-op
                }}
              />
            );
          }
          return (
            <WorkspaceActionsDropdown
              context={context}
              position="right"
              toggle="dropdown-toggle"
              workspace={this.props.workspace}
              onAction={async () => {
                // no-op
              }}
            />
          );
        }}
      </WorkspaceActionsConsumer>
    );
  }
}
