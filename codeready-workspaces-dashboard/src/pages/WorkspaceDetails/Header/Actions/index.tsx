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
import WorkspaceActionsProvider from '../../../../containers/WorkspaceActions';
import { WorkspaceAction, WorkspaceStatus, DevWorkspaceStatus } from '../../../../services/helpers/types';
import { History } from 'history';

import './Actions.styl';
import { ActionContextType, WorkspaceActionsConsumer } from '../../../../containers/WorkspaceActions/context';
import { lazyInject } from '../../../../inversify.config';
import { AppAlerts } from '../../../../services/alerts/appAlerts';
import getRandomString from '../../../../services/helpers/random';

type Props = {
  workspaceId: string;
  workspaceName: string;
  status: string | undefined;
  history: History;
};

type State = {
  isExpanded: boolean;
  isModalOpen: boolean;
}

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

  private async handleSelect(selected: WorkspaceAction, context: ActionContextType): Promise<void> {
    this.setState({
      isExpanded: false,
    });
    try {
      if (selected === WorkspaceAction.DELETE_WORKSPACE) {
        try {
          await context.showConfirmation([this.props.workspaceName]);
        } catch (e) {
          return;
        }
      }
      const nextPath = await context.handleAction(selected, this.props.workspaceId);
      if (!nextPath) {
        return;
      }
      this.props.history.push(nextPath);
    } catch (e) {
      const message = `Unable to ${selected.toLocaleLowerCase()} ${this.props.workspaceName}. ` + e.toString().replace('Error: ', '');
      this.showAlert(message);
      console.warn(message);
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

    return [
      (<DropdownItem
        key={`action-${WorkspaceAction.OPEN_IDE}`}
        isDisabled={status === DevWorkspaceStatus.TERMINATING}
        onClick={async () => this.handleSelect(WorkspaceAction.OPEN_IDE, context)}>
        <div>{WorkspaceAction.OPEN_IDE}</div>
      </DropdownItem>),
      (<DropdownItem
        key={`action-${WorkspaceAction.START_DEBUG_AND_OPEN_LOGS}`}
        isDisabled={status === DevWorkspaceStatus.TERMINATING || status !== WorkspaceStatus.STOPPED}
        onClick={async () => this.handleSelect(WorkspaceAction.START_DEBUG_AND_OPEN_LOGS, context)}>
        <div>{WorkspaceAction.START_DEBUG_AND_OPEN_LOGS}</div>
      </DropdownItem>),
      (<DropdownItem
        key={`action-${WorkspaceAction.START_IN_BACKGROUND}`}
        isDisabled={status === DevWorkspaceStatus.TERMINATING || status !== WorkspaceStatus.STOPPED}
        onClick={async () => this.handleSelect(WorkspaceAction.START_IN_BACKGROUND, context)}>
        <div>{WorkspaceAction.START_IN_BACKGROUND}</div>
      </DropdownItem>),
      (<DropdownItem
        key={`action-${WorkspaceAction.STOP_WORKSPACE}`}
        isDisabled={status === DevWorkspaceStatus.TERMINATING || status === WorkspaceStatus.STOPPED}
        onClick={async () => this.handleSelect(WorkspaceAction.STOP_WORKSPACE, context)}>
        <div>{WorkspaceAction.STOP_WORKSPACE}</div>
      </DropdownItem>),
      (<DropdownItem
        key={`action-${WorkspaceAction.DELETE_WORKSPACE}`}
        isDisabled={status === DevWorkspaceStatus.TERMINATING || status === WorkspaceStatus.STARTING || status === WorkspaceStatus.STOPPING}
        onClick={async () => this.handleSelect(WorkspaceAction.DELETE_WORKSPACE, context)}>
        <div>{WorkspaceAction.DELETE_WORKSPACE}</div>
      </DropdownItem>),
    ];
  }

  render(): React.ReactNode {
    const { workspaceId } = this.props;
    const { isExpanded } = this.state;

    return (
      <WorkspaceActionsProvider>
        <WorkspaceActionsConsumer>
          {context => (
            <Dropdown
              className="workspace-action-selector"
              toggle={(
                <DropdownToggle
                  data-testid={`${workspaceId}-action-dropdown`}
                  onToggle={isExpanded => this.handleToggle(isExpanded)}
                  toggleIndicator={CaretDownIcon}
                  isPrimary>
                  Actions
                </DropdownToggle>
              )}
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
