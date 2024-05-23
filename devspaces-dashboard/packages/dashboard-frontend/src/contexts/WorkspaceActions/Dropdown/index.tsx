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
import {
  AlertVariant,
  Dropdown,
  DropdownItem,
  DropdownProps,
  DropdownToggle,
  KebabToggle,
} from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import React from 'react';

import { ActionContextType } from '@/contexts/WorkspaceActions';
import styles from '@/contexts/WorkspaceActions/Dropdown/index.module.css';
import { lazyInject } from '@/inversify.config';
import { AppAlerts } from '@/services/alerts/appAlerts';
import getRandomString from '@/services/helpers/random';
import { DevWorkspaceStatus, WorkspaceAction, WorkspaceStatus } from '@/services/helpers/types';
import { Workspace } from '@/services/workspace-adapter';

export type Props = {
  context: ActionContextType;
  isDisabled?: boolean;
  toggle: 'kebab-toggle' | 'dropdown-toggle';
  workspace: Workspace;
  onAction?: (
    action: WorkspaceAction,
    workspaceUID: string,
    // true if the action succeeded, false if it failed, undefined if the action was not performed
    succeeded: boolean | undefined,
  ) => Promise<void>;
} & Pick<DropdownProps, 'menuAppendTo' | 'position' | 'isPlain'>;

export type State = {
  isExpanded: boolean;
};

export class WorkspaceActionsDropdown extends React.PureComponent<Props, State> {
  @lazyInject(AppAlerts)
  private appAlerts: AppAlerts;

  constructor(props: Props) {
    super(props);

    this.state = {
      isExpanded: false,
    };
  }

  private buildToggle(): React.ReactElement {
    const { isDisabled = false, toggle, workspace } = this.props;

    if (toggle === 'kebab-toggle') {
      return (
        <KebabToggle
          aria-label="Actions"
          data-testid={`${workspace.uid}-action-dropdown`}
          data-testtype="kebab-toggle"
          isDisabled={isDisabled}
          onToggle={isExpanded => this.handleToggle(isExpanded)}
        />
      );
    }

    return (
      <DropdownToggle
        aria-label="Actions"
        data-testid={`${workspace.uid}-action-dropdown`}
        data-testtype="dropdown-toggle"
        isDisabled={isDisabled}
        onToggle={isExpanded => this.handleToggle(isExpanded)}
        toggleIndicator={CaretDownIcon}
        toggleVariant="primary"
      >
        Actions
      </DropdownToggle>
    );
  }

  private handleToggle(isExpanded: boolean): void {
    this.setState({ isExpanded });
  }

  private async handleSelect(action: WorkspaceAction): Promise<void> {
    const { context, onAction, workspace } = this.props;

    this.handleToggle(false);

    let succeeded: boolean | undefined = undefined;
    try {
      if (action === WorkspaceAction.DELETE_WORKSPACE) {
        try {
          await context.showConfirmation([workspace.name]);
        } catch (e) {
          return onAction?.(action, workspace.uid, undefined);
        }
      }

      await context.handleAction(action, workspace.uid);
      succeeded = true;
    } catch (e) {
      const errorMessage = `Unable to ${action.toLocaleLowerCase()} ${
        workspace.name
      }. ${helpers.errors.getMessage(e)}`;
      this.showAlert(errorMessage);
      console.error(errorMessage);
      succeeded = false;
    }

    return onAction?.(action, workspace.uid, succeeded);
  }

  private showAlert(message: string): void {
    this.appAlerts.showAlert({
      key: 'workspace-dropdown-action-' + getRandomString(4),
      title: message,
      variant: AlertVariant.warning,
    });
  }

  private getDropdownItems(): React.ReactNode[] {
    const { workspace } = this.props;
    const isStopped =
      workspace.status === WorkspaceStatus.STOPPED ||
      workspace.status === DevWorkspaceStatus.STOPPED ||
      workspace.status === DevWorkspaceStatus.FAILED;
    const isTerminating = workspace.status === DevWorkspaceStatus.TERMINATING;

    const getItem = (action: WorkspaceAction, isDisabled: boolean) => {
      return (
        <DropdownItem
          aria-label={`Action: ${action}`}
          component="button"
          key={`action-${action}`}
          isDisabled={isDisabled}
          onClick={async e => {
            e.preventDefault();
            e.stopPropagation();

            return this.handleSelect(action);
          }}
        >
          {action}
        </DropdownItem>
      );
    };

    return [
      getItem(WorkspaceAction.OPEN_IDE, isTerminating),
      getItem(WorkspaceAction.START_DEBUG_AND_OPEN_LOGS, isTerminating || isStopped === false),
      getItem(WorkspaceAction.START_IN_BACKGROUND, isTerminating || isStopped === false),
      getItem(WorkspaceAction.RESTART_WORKSPACE, isTerminating || isStopped),
      getItem(WorkspaceAction.STOP_WORKSPACE, isTerminating || isStopped),
      getItem(WorkspaceAction.DELETE_WORKSPACE, isTerminating),
    ];
  }

  render(): React.ReactElement {
    const { isExpanded } = this.state;
    const { isPlain = false, menuAppendTo = 'inline', position = 'left' } = this.props;

    const dropdownToggle = this.buildToggle();
    const dropdownItems = this.getDropdownItems();

    return (
      <Dropdown
        className={styles.workspaceActionSelector}
        dropdownItems={dropdownItems}
        isOpen={isExpanded}
        isPlain={isPlain}
        menuAppendTo={menuAppendTo}
        position={position}
        toggle={dropdownToggle}
      />
    );
  }
}
