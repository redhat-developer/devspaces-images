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

export class WorkspaceActionsDeleteButton extends React.Component<Props> {
  render() {
    const { onAction, workspace } = this.props;
    return (
      <button
        data-testid="workspace-actions-delete-button"
        onClick={() => onAction?.(WorkspaceAction.DELETE_WORKSPACE, workspace.uid, true)}
      >
        Delete
      </button>
    );
  }
}
