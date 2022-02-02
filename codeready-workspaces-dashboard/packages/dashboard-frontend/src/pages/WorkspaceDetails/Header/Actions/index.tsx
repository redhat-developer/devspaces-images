/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { AlertVariant, Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import React from 'react';
import { History } from 'history';
import common from '@eclipse-che/common';
import WorkspaceActionsProvider from '../../../../containers/WorkspaceActions';
import {
  WorkspaceAction,
  WorkspaceStatus,
  DevWorkspaceStatus,
  DeprecatedWorkspaceStatus,
} from '../../../../services/helpers/types';
import {
  ActionContextType,
  WorkspaceActionsConsumer,
} from '../../../../containers/WorkspaceActions/context';
import { lazyInject } from '../../../../inversify.config';
import { AppAlerts } from '../../../../services/alerts/appAlerts';
import getRandomString from '../../../../services/helpers/random';

import styles from './index.module.css';

type Props = {
  workspaceId: string;
  workspaceName: string;
  status: WorkspaceStatus | DevWorkspaceStatus | DeprecatedWorkspaceStatus;
  history: History;
};

type State = {
  isExpanded: boolean;
  isModalOpen: boolean;
};

export class HeaderActionSelect extends React.PureComponent<Props, State> {
  @lazyInject(AppAlerts)
  private appAlerts: AppAlerts;

  constructor(props: Props) {
    super(props);

    this.state = {
      isExpanded: false,
      isModalOpen: false,
    };
  }

  private handleToggle(isExpanded: boolean): void {
    if (this.state.isModalOpen) {
      return;
    }
    this.setState({ isExpanded });
  }

  private async handleSelectedAction(
    selectedAction: WorkspaceAction,
    context: ActionContextType,
  ): Promise<void> {
    this.setState({
      isExpanded: false,
    });
    try {
      if (selectedAction === WorkspaceAction.DELETE_WORKSPACE) {
        try {
          await context.showConfirmation([this.props.workspaceName]);
        } catch (e) {
          return;
        }
      }
      const nextPath = await context.handleAction(selectedAction, this.props.workspaceId);
      if (!nextPath) {
        return;
      }
      this.props.history.push(nextPath);
    } catch (e) {
      const errorMessage = common.helpers.errors.getMessage(e);
      this.showAlert(errorMessage);
      console.warn(errorMessage);
    }
  }

  private showAlert(message: string): void {
    this.appAlerts.showAlert({
      key: 'workspace-details-' + getRandomString(4),
      title: message,
      variant: AlertVariant.warning,
    });
  }

  private getDropdownItems(context: ActionContextType): React.ReactNode[] {
    const { status } = this.props;

    if (status === 'Deprecated') {
      return [
        <DropdownItem
          key={`action-${WorkspaceAction.DELETE_WORKSPACE}`}
          isDisabled={false}
          onClick={async () => this.handleSelectedAction(WorkspaceAction.DELETE_WORKSPACE, context)}
        >
          <div>{WorkspaceAction.DELETE_WORKSPACE}</div>
        </DropdownItem>,
      ];
    }

    return [
      <DropdownItem
        key={`action-${WorkspaceAction.OPEN_IDE}`}
        isDisabled={status === DevWorkspaceStatus.TERMINATING}
        onClick={async () => this.handleSelectedAction(WorkspaceAction.OPEN_IDE, context)}
      >
        <div>{WorkspaceAction.OPEN_IDE}</div>
      </DropdownItem>,
      <DropdownItem
        key={`action-${WorkspaceAction.START_DEBUG_AND_OPEN_LOGS}`}
        isDisabled={status === DevWorkspaceStatus.TERMINATING || status !== WorkspaceStatus.STOPPED}
        onClick={async () =>
          this.handleSelectedAction(WorkspaceAction.START_DEBUG_AND_OPEN_LOGS, context)
        }
      >
        <div>{WorkspaceAction.START_DEBUG_AND_OPEN_LOGS}</div>
      </DropdownItem>,
      <DropdownItem
        key={`action-${WorkspaceAction.START_IN_BACKGROUND}`}
        isDisabled={status === DevWorkspaceStatus.TERMINATING || status !== WorkspaceStatus.STOPPED}
        onClick={async () =>
          this.handleSelectedAction(WorkspaceAction.START_IN_BACKGROUND, context)
        }
      >
        <div>{WorkspaceAction.START_IN_BACKGROUND}</div>
      </DropdownItem>,
      <DropdownItem
        key={`action-${WorkspaceAction.RESTART_WORKSPACE}`}
        isDisabled={status === DevWorkspaceStatus.TERMINATING || status === WorkspaceStatus.STOPPED}
        onClick={async () => this.handleSelectedAction(WorkspaceAction.RESTART_WORKSPACE, context)}
      >
        <div>{WorkspaceAction.RESTART_WORKSPACE}</div>
      </DropdownItem>,
      <DropdownItem
        key={`action-${WorkspaceAction.STOP_WORKSPACE}`}
        isDisabled={status === DevWorkspaceStatus.TERMINATING || status === WorkspaceStatus.STOPPED}
        onClick={async () => this.handleSelectedAction(WorkspaceAction.STOP_WORKSPACE, context)}
      >
        <div>{WorkspaceAction.STOP_WORKSPACE}</div>
      </DropdownItem>,
      <DropdownItem
        key={`action-${WorkspaceAction.DELETE_WORKSPACE}`}
        isDisabled={
          status === DevWorkspaceStatus.TERMINATING ||
          status === WorkspaceStatus.STARTING ||
          status === WorkspaceStatus.STOPPING
        }
        onClick={async () => this.handleSelectedAction(WorkspaceAction.DELETE_WORKSPACE, context)}
      >
        <div>{WorkspaceAction.DELETE_WORKSPACE}</div>
      </DropdownItem>,
    ];
  }

  render(): React.ReactNode {
    const { workspaceId, history } = this.props;
    const { isExpanded } = this.state;

    return (
      <WorkspaceActionsProvider history={history}>
        <WorkspaceActionsConsumer>
          {context => (
            <Dropdown
              className={styles.workspaceActionSelector}
              toggle={
                <DropdownToggle
                  data-testid={`${workspaceId}-action-dropdown`}
                  onToggle={isExpanded => this.handleToggle(isExpanded)}
                  toggleIndicator={CaretDownIcon}
                  isPrimary
                >
                  Actions
                </DropdownToggle>
              }
              isOpen={isExpanded}
              position="right"
              dropdownItems={this.getDropdownItems(context)}
            />
          )}
        </WorkspaceActionsConsumer>
      </WorkspaceActionsProvider>
    );
  }
}
