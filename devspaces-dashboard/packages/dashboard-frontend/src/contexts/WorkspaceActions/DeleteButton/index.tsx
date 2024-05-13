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

import { ActionContextType } from '@/contexts/WorkspaceActions';
import { lazyInject } from '@/inversify.config';
import { AppAlerts } from '@/services/alerts/appAlerts';
import getRandomString from '@/services/helpers/random';
import { WorkspaceAction } from '@/services/helpers/types';
import { Workspace } from '@/services/workspace-adapter';

export type Props = {
  context: ActionContextType;
  workspace: Workspace;
  onAction?: (
    action: WorkspaceAction,
    workspaceUID: string,
    succeeded: boolean | undefined,
  ) => Promise<void>;
};

export class WorkspaceActionsDeleteButton extends React.PureComponent<Props> {
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
    const { context, onAction, workspace } = this.props;
    const action = WorkspaceAction.DELETE_WORKSPACE;

    let succeeded: boolean | undefined = undefined;

    try {
      await context.showConfirmation([workspace.name]);
    } catch (e) {
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
  }

  render(): React.ReactElement {
    return (
      <Button
        variant={ButtonVariant.danger}
        isDisabled={false}
        onClick={async () => this.handleClick()}
      >
        {WorkspaceAction.DELETE_WORKSPACE}
      </Button>
    );
  }
}
