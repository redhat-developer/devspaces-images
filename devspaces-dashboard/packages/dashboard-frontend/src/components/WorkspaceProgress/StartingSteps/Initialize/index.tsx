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

import { helpers } from '@eclipse-che/common';
import { AlertVariant } from '@patternfly/react-core';
import isEqual from 'lodash/isEqual';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { MIN_STEP_DURATION_MS, TIMEOUT_TO_STOP_SEC } from '@/components/WorkspaceProgress/const';
import {
  ProgressStep,
  ProgressStepProps,
  ProgressStepState,
} from '@/components/WorkspaceProgress/ProgressStep';
import { ProgressStepTitle } from '@/components/WorkspaceProgress/StepTitle';
import { TimeLimit } from '@/components/WorkspaceProgress/TimeLimit';
import { WorkspaceParams } from '@/Routes/routes';
import { delay } from '@/services/helpers/delay';
import { findTargetWorkspace } from '@/services/helpers/factoryFlow/findTargetWorkspace';
import { AlertItem, DevWorkspaceStatus, LoaderTab } from '@/services/helpers/types';
import { Workspace } from '@/services/workspace-adapter';
import { AppState } from '@/store';
import * as WorkspaceStore from '@/store/Workspaces';
import { selectAllWorkspaces } from '@/store/Workspaces/selectors';

export type Props = MappedProps &
  ProgressStepProps & {
    matchParams: WorkspaceParams | undefined;
  };
export type State = ProgressStepState;

class StartingStepInitialize extends ProgressStep<Props, State> {
  protected readonly name = 'Initializing';

  constructor(props: Props) {
    super(props);

    this.state = {
      name: this.name,
    };
  }

  private init(): void {
    if (this.props.distance !== 0) {
      return;
    }

    this.prepareAndRun();
  }

  public componentDidMount() {
    this.init();
  }

  public async componentDidUpdate() {
    this.init();
  }

  public shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    // active step changed
    if (this.props.distance !== nextProps.distance) {
      return true;
    }

    const workspace = this.findTargetWorkspace(this.props);
    const nextWorkspace = this.findTargetWorkspace(nextProps);

    // change workspace status, etc.
    if (workspace?.uid !== nextWorkspace?.uid || workspace?.status !== nextWorkspace?.status) {
      return true;
    }
    // set the error for the current step
    if (!isEqual(this.state.lastError, nextState.lastError)) {
      return true;
    }
    return false;
  }

  public componentWillUnmount(): void {
    this.toDispose.dispose();
  }

  private isWorkspaceStatus(workspace: Workspace, ...statuses: DevWorkspaceStatus[]): boolean {
    return statuses.some(status => status === workspace.status);
  }

  protected handleRestart(alertKey: string, tab: LoaderTab): void {
    this.props.onHideError(alertKey);

    this.clearStepError();
    this.props.onRestart(tab);
  }

  protected handleTimeout(workspace: Workspace | undefined): void {
    const message =
      workspace === undefined
        ? 'Cannot determine the workspace to start.'
        : `The workspace status remains "${workspace.status}" in the last ${TIMEOUT_TO_STOP_SEC} seconds.`;
    const timeoutError = new Error(message);
    this.handleError(timeoutError);
  }

  /**
   * The resolved boolean indicates whether to go to the next step or not
   */
  protected async runStep(): Promise<boolean> {
    await delay(MIN_STEP_DURATION_MS);

    const { matchParams } = this.props;
    const workspace = this.findTargetWorkspace(this.props);

    // if the current step error
    if (this.state.lastError !== undefined) {
      // wait, do not switch to the next step
      return false;
    }

    if (matchParams === undefined) {
      throw new Error('Cannot determine the workspace to start.');
    }

    if (!workspace) {
      throw new Error(
        `Workspace "${matchParams.namespace}/${matchParams.workspaceName}" not found.`,
      );
    }

    if (workspace.isDeprecated) {
      throw new Error('The workspace is deprecated. Convert the workspace and try again.');
    }

    if (this.isWorkspaceStatus(workspace, DevWorkspaceStatus.TERMINATING)) {
      throw new Error(workspace.error || 'The workspace is terminating and cannot be open.');
    }

    // if stopping / failing
    if (
      this.isWorkspaceStatus(workspace, DevWorkspaceStatus.STOPPING, DevWorkspaceStatus.FAILING)
    ) {
      // wait, do not switch to the next step
      return false;
    }

    // switch to the next step
    return true;
  }

  protected findTargetWorkspace(props: Props): Workspace | undefined {
    if (props.matchParams === undefined) {
      return;
    }

    return findTargetWorkspace(props.allWorkspaces, props.matchParams);
  }

  protected buildAlertItem(error: Error): AlertItem {
    const key = this.name;
    return {
      key,
      title: 'Failed to open the workspace',
      variant: AlertVariant.danger,
      children: helpers.errors.getMessage(error),
      actionCallbacks: [
        {
          title: 'Restart',
          callback: () => this.handleRestart(key, LoaderTab.Progress),
        },
      ],
    };
  }

  render(): React.ReactNode {
    const { distance, hasChildren } = this.props;
    const { name, lastError } = this.state;

    const workspace = this.findTargetWorkspace(this.props);

    const isActive = distance === 0;
    const isError = lastError !== undefined;
    const isWarning = false;

    return (
      <React.Fragment>
        {isActive && (
          <TimeLimit
            timeLimitSec={TIMEOUT_TO_STOP_SEC}
            onTimeout={() => this.handleTimeout(workspace)}
          />
        )}
        <ProgressStepTitle
          distance={distance}
          hasChildren={hasChildren}
          isError={isError}
          isWarning={isWarning}
        >
          {name}
        </ProgressStepTitle>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  allWorkspaces: selectAllWorkspaces(state),
});

const connector = connect(mapStateToProps, WorkspaceStore.actionCreators, null, {
  // forwardRef is mandatory for using `@react-mock/state` in unit tests
  forwardRef: true,
});
type MappedProps = ConnectedProps<typeof connector>;
export default connector(StartingStepInitialize);
