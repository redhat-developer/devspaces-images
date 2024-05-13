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

import { Props } from '@/contexts/WorkspaceActions/Dropdown';
import { WorkspaceAction } from '@/services/helpers/types';

export class WorkspaceActionsDropdown extends React.PureComponent<Props> {
  public render(): React.ReactElement {
    const { isDisabled = false, onAction, workspace } = this.props;
    return (
      <div data-testid="workspace-actions-dropdown">
        <button
          data-testid="workspace-actions-dropdown-open-workspace-button"
          disabled={isDisabled}
          onClick={() => onAction?.(WorkspaceAction.OPEN_IDE, workspace.uid, true)}
        >
          {WorkspaceAction.OPEN_IDE}
        </button>
      </div>
    );
  }
}
