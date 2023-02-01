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
import { AlertVariant, Dropdown, DropdownItem, KebabToggle } from '@patternfly/react-core';
import { NavigationRecentItemObject } from '.';
import WorkspaceActionsProvider from '../../contexts/WorkspaceActions/Provider';
import { ActionContextType, WorkspaceActionsConsumer } from '../../contexts/WorkspaceActions';
import { DevWorkspaceStatus, WorkspaceAction, WorkspaceStatus } from '../../services/helpers/types';
import getRandomString from '../../services/helpers/random';
import { lazyInject } from '../../inversify.config';
import { AppAlerts } from '../../services/alerts/appAlerts';
import { History } from 'history';

type Props = {
  item: NavigationRecentItemObject;
  history: History;
  isDefaultExpanded?: boolean;
};

type State = {
  isExpanded: boolean;
};

class NavigationItemWorkspaceActions extends React.PureComponent<Props, State> {
  @lazyInject(AppAlerts)
  private appAlerts: AppAlerts;

  constructor(props: Props) {
    super(props);

    this.state = {
      isExpanded: this.props.isDefaultExpanded === true,
    };
  }

  private showAlert(message: string): void {
    this.appAlerts.showAlert({
      key: 'navbar-item-' + getRandomString(4),
      title: message,
      variant: AlertVariant.warning,
    });
  }

  private async handleSelect(selected: WorkspaceAction, context: ActionContextType): Promise<void> {
    this.setState({
      isExpanded: false,
    });
    try {
      const nextPath = await context.handleAction(selected, this.props.item.workspaceUID);
      if (!nextPath) {
        return;
      }
      this.props.history.push(nextPath);
    } catch (e) {
      const message = `Unable to ${selected.toLocaleLowerCase()} ${this.props.item.label}. ${e}`;
      this.showAlert(message);
      console.warn(message);
    }
  }

  private getDropdownItems(context: ActionContextType): React.ReactNode[] {
    const {
      item: { status },
    } = this.props;
    const dropdownItems: React.ReactNode[] = [];

    const createAction = (action: WorkspaceAction): React.ReactNode => (
      <DropdownItem
        key={`action-${action}`}
        onClick={e => {
          e.stopPropagation();
          this.handleSelect(action, context);
        }}
      >
        <div>{action}</div>
      </DropdownItem>
    );

    if (
      status === WorkspaceStatus.STOPPED ||
      status === DevWorkspaceStatus.STOPPED ||
      status === DevWorkspaceStatus.FAILED
    ) {
      dropdownItems.push(
        createAction(WorkspaceAction.START_DEBUG_AND_OPEN_LOGS),
        createAction(WorkspaceAction.START_IN_BACKGROUND),
      );
    } else if (status !== WorkspaceStatus.STOPPING && status !== DevWorkspaceStatus.TERMINATING) {
      dropdownItems.push(createAction(WorkspaceAction.STOP_WORKSPACE));
    }
    if (
      status !== WorkspaceStatus.STOPPING &&
      status !== WorkspaceStatus.STOPPED &&
      status !== DevWorkspaceStatus.STOPPING &&
      status !== DevWorkspaceStatus.STOPPED &&
      status !== DevWorkspaceStatus.TERMINATING
    ) {
      dropdownItems.push(createAction(WorkspaceAction.RESTART_WORKSPACE));
    }
    dropdownItems.push(createAction(WorkspaceAction.EDIT_WORKSPACE));

    return dropdownItems;
  }

  private handleToggle(isExpanded: boolean): void {
    this.setState({ isExpanded });
  }

  public render(): React.ReactElement {
    const { isExpanded } = this.state;
    const { history } = this.props;
    const menuAppendTo = document.getElementById('page-sidebar') || 'inline';

    return (
      <WorkspaceActionsProvider history={history}>
        <WorkspaceActionsConsumer>
          {context => (
            <Dropdown
              onClick={e => e.stopPropagation()}
              toggle={
                <KebabToggle
                  onBlur={() => {
                    if (isExpanded) {
                      setTimeout(() => {
                        this.handleToggle(false);
                      }, 500);
                    }
                  }}
                  onToggle={isExpanded => this.handleToggle(isExpanded)}
                />
              }
              isOpen={isExpanded}
              position="right"
              dropdownItems={this.getDropdownItems(context)}
              menuAppendTo={menuAppendTo}
              isPlain
            />
          )}
        </WorkspaceActionsConsumer>
      </WorkspaceActionsProvider>
    );
  }
}

export default NavigationItemWorkspaceActions;
