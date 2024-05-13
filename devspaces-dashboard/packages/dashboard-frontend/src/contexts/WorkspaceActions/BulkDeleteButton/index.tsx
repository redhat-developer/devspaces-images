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

import { helpers } from '@eclipse-che/common';
import { AlertVariant, Button, ButtonVariant } from '@patternfly/react-core';
import React from 'react';

import { ActionContextType, ArrayNonempty } from '@/contexts/WorkspaceActions';
import { lazyInject } from '@/inversify.config';
import { AppAlerts } from '@/services/alerts/appAlerts';
import getRandomString from '@/services/helpers/random';
import { WorkspaceAction } from '@/services/helpers/types';
import { Workspace } from '@/services/workspace-adapter';

export type Props = {
  context: ActionContextType;
  isDisabled: boolean;
  workspaces: Workspace[];
  onAction?: (
    action: WorkspaceAction,
    workspaceUID: string,
    // true if the action succeeded, false if it failed, undefined if the action was not performed
    succeeded: boolean | undefined,
  ) => Promise<void>;
};

export class WorkspaceActionsBulkDeleteButton extends React.PureComponent<Props> {
  @lazyInject(AppAlerts)
  private appAlerts: AppAlerts;

  private showAlert(message: string): void {
    this.appAlerts.showAlert({
      key: 'workspace-dropdown-action-' + getRandomString(4),
      title: message,
      variant: AlertVariant.warning,
    });
  }

  private async handleClick(): Promise<void> {
    const { context, onAction, workspaces } = this.props;
    const action = WorkspaceAction.DELETE_WORKSPACE;

    if (workspaces.length === 0) {
      console.log('No workspaces selected for deletion.');
      return;
    }

    const wantDelete = workspaces.map(workspace => workspace.name) as ArrayNonempty<string>;

    let deleteConfirmed = false;
    try {
      await context.showConfirmation(wantDelete);
      deleteConfirmed = true;
    } catch (e) {
      // no-op
    }

    const promises = workspaces.map(async (workspace: Workspace) => {
      let succeeded: boolean | undefined = undefined;

      if (deleteConfirmed === false) {
        return onAction?.(action, workspace.uid, succeeded);
      }

      try {
        await context.handleAction(action, workspace.uid);
        succeeded = true;
      } catch (e) {
        const errorMessage = `Unable to ${action.toLocaleLowerCase()} ${
          workspace.name
        }. ${helpers.errors.getMessage(e)}`;
        this.showAlert(errorMessage);
        console.warn(errorMessage);
        succeeded = false;
      }

      return onAction?.(action, workspace.uid, succeeded);
    });

    await Promise.allSettled(promises);
  }

  render(): React.ReactElement {
    const { isDisabled } = this.props;

    return (
      <Button
        aria-label="Delete Selected Workspaces"
        variant={ButtonVariant.primary}
        isDisabled={isDisabled}
        onClick={async () => this.handleClick()}
      >
        Delete
      </Button>
    );
  }
}
