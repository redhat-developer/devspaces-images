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

import { WorkspaceAction } from '@/services/helpers/types';

import { Props } from '..';

export class WorkspaceActionsBulkDeleteButton extends React.Component<Props> {
  render() {
    const { isDisabled, onAction, workspaces } = this.props;

    const handleAction = () =>
      workspaces.map(workspace =>
        onAction?.(WorkspaceAction.DELETE_WORKSPACE, workspace.uid, true),
      );

    return (
      <div data-testid="workspace-actions-bulk-delete">
        <span data-testid="workspaces-number">{workspaces.length}</span>
        <button disabled={isDisabled} onClick={() => handleAction()}>
          Delete Selected Workspaces
        </button>
      </div>
    );
  }
}
