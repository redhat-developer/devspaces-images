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

import common from '@eclipse-che/common';
import { AlertVariant } from '@patternfly/react-core';
import { isEqual } from 'lodash';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { TIMEOUT_TO_STOP_SEC } from '@/components/WorkspaceProgress/const';
import {
  ProgressStep,
  ProgressStepProps,
  ProgressStepState,
} from '@/components/WorkspaceProgress/ProgressStep';
import { ProgressStepTitle } from '@/components/WorkspaceProgress/StepTitle';
import { TimeLimit } from '@/components/WorkspaceProgress/TimeLimit';
import workspaceStatusIs from '@/components/WorkspaceProgress/workspaceStatusIs';
import { ToggleBarsContext } from '@/contexts/ToggleBars';
import { WorkspaceParams } from '@/Routes/routes';
import { findTargetWorkspace } from '@/services/helpers/factoryFlow/findTargetWorkspace';
import { buildHomeLocation, buildIdeLoaderLocation } from '@/services/helpers/location';
import { AlertItem, DevWorkspaceStatus, LoaderTab } from '@/services/helpers/types';
import { Workspace } from '@/services/workspace-adapter';
import { AppState } from '@/store';
import { selectRunningWorkspacesLimit } from '@/store/ClusterConfig/selectors';
import * as WorkspaceStore from '@/store/Workspaces';
import { RunningWorkspacesExceededError } from '@/store/Workspaces/devWorkspaces';
import { throwRunningWorkspacesExceededError } from '@/store/Workspaces/devWorkspaces/checkRunningWorkspacesLimit';
import { selectRunningDevWorkspacesLimitExceeded } from '@/store/Workspaces/devWorkspaces/selectors';
import { selectAllWorkspaces, selectRunningWorkspaces } from '@/store/Workspaces/selectors';

export type Props = MappedProps &
  ProgressStepProps & {
    matchParams: WorkspaceParams | undefined;
  };
export type State = ProgressStepState & {
  shouldStop: boolean; // should the loader to stop another workspace if the running workspaces limit is exceeded
  redundantWorkspaceUID?: string;
};

class CommonStepCheckRunningWorkspacesLimit extends ProgressStep<Props, State> {
  protected readonly name = 'Checking for the limit of running workspaces';
  static contextType = ToggleBarsContext;
  readonly context: React.ContextType<typeof ToggleBarsContext>;

  constructor(props: Props) {
    super(props);

    this.state = {
      shouldStop: false,
      name: this.name,
    };
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

    const workspace = this.findRedundantWorkspace(this.props, this.state);
    const nextWorkspace = this.findRedundantWorkspace(nextProps, nextState);

    // change the extra workspace status, etc.
    if (
      workspace?.uid !== nextWorkspace?.uid ||
      workspace?.status !== nextWorkspace?.status ||
      workspace?.ideUrl !== nextWorkspace?.ideUrl
    ) {
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

  private init() {
    if (this.props.distance !== 0) {
      return;
    }

    if (this.state.lastError) {
      return;
    }

    const { runningDevWorkspacesLimitExceeded, runningWorkspaces } = this.props;
    const targetWorkspace = this.findTargetWorkspace(this.props);
    const targetWorkspaceIsRunning = runningWorkspaces.some(w => w.uid === targetWorkspace?.uid);

    if (targetWorkspaceIsRunning === false && runningDevWorkspacesLimitExceeded === true) {
      this.setState({
        shouldStop: true,
      });
    }

    this.prepareAndRun();
  }

  /**
   * The resolved boolean indicates whether to go to the next step or not
   */
  protected async runStep(): Promise<boolean> {
    const { runningWorkspacesLimit } = this.props;
    const { shouldStop, redundantWorkspaceUID } = this.state;

    const redundantWorkspace = this.findRedundantWorkspace(this.props, this.state);

    // the running workspaces limit hasn't been exceeded, switch to the next step
    if (shouldStop === false) {
      return true;
    }

    if (redundantWorkspaceUID === undefined) {
      // this will show a notification with action links
      // to ask user which workspace to stop or to switch
      throwRunningWorkspacesExceededError(runningWorkspacesLimit);
    }

    // the workspace has been stopped or removed, switch to the next step
    if (
      redundantWorkspace === undefined ||
      workspaceStatusIs(redundantWorkspace, DevWorkspaceStatus.STOPPED, DevWorkspaceStatus.FAILED)
    ) {
      const text =
        redundantWorkspace === undefined
          ? ', the redundant workspace has been removed'
          : `, workspace ${redundantWorkspace.name} has been stopped`;
      this.appendToName(text);

      return true;
    }

    if (
      workspaceStatusIs(redundantWorkspace, DevWorkspaceStatus.STARTING, DevWorkspaceStatus.RUNNING)
    ) {
      try {
        await this.props.stopWorkspace(redundantWorkspace);

        this.appendToName(`, waiting for ${redundantWorkspace.name} to stop`);

        return false;
      } catch (e) {
        throw new Error(common.helpers.errors.getMessage(e));
      }
    }

    if (
      workspaceStatusIs(
        redundantWorkspace,
        DevWorkspaceStatus.STOPPING,
        DevWorkspaceStatus.FAILING,
        DevWorkspaceStatus.TERMINATING,
      )
    ) {
      // do not switch to the next step
      return false;
    }

    // switch to the next step
    return true;
  }

  private appendToName(text: string) {
    const { name } = this.state;
    if (name.endsWith(text)) {
      return;
    }
    const newName = this.name + text;
    this.setState({
      name: newName,
    });
  }

  protected handleRestart(alertKey: string, tabName?: LoaderTab): void {
    this.props.onHideError(alertKey);

    this.setState({
      shouldStop: true,
      redundantWorkspaceUID: undefined,
    });
    this.clearStepError();
    this.props.onRestart(tabName);
  }

  private handleOpenDashboard(alertKey: string): void {
    this.props.onHideError(alertKey);

    this.context.showAll();

    const homeLocation = buildHomeLocation();
    this.props.history.push(homeLocation);
  }

  private handleStopRedundantWorkspace(alertKey: string, redundantWorkspace: Workspace): void {
    this.props.onHideError(alertKey);

    this.setState({
      lastError: undefined,
      redundantWorkspaceUID: redundantWorkspace.uid,
    });
  }

  private handleSwitchToWorkspace(alertKey: string, workspace: Workspace): void {
    this.props.onHideError(alertKey);

    // update browsing context
    window.name = workspace.uid;

    const workspaceLoaderLocation = buildIdeLoaderLocation(workspace);
    this.props.history.push(workspaceLoaderLocation);
    this.props.history.go(0);
  }

  protected handleTimeout(redundantWorkspace: Workspace | undefined): void {
    const message = redundantWorkspace
      ? `The workspace status remains "${redundantWorkspace.status}" in the last ${TIMEOUT_TO_STOP_SEC} seconds.`
      : `Could not check running workspaces limit in the last ${TIMEOUT_TO_STOP_SEC} seconds.`;
    const timeoutError = new Error(message);
    this.handleError(timeoutError);
  }

  protected findRedundantWorkspace(props: Props, state: State): Workspace | undefined {
    return props.allWorkspaces.find(workspace => workspace.uid === state.redundantWorkspaceUID);
  }

  protected findTargetWorkspace(props: Props): Workspace | undefined {
    if (props.matchParams === undefined) {
      return undefined;
    }
    return findTargetWorkspace(props.allWorkspaces, props.matchParams);
  }

  protected buildAlertItem(error: Error): AlertItem {
    const { runningWorkspaces } = this.props;
    const key = this.name;

    if (error instanceof RunningWorkspacesExceededError) {
      const runningWorkspacesAlertItem: AlertItem = {
        key,
        title: 'Running workspace(s) found.',
        variant: AlertVariant.warning,
        children: common.helpers.errors.getMessage(error),
      };

      if (runningWorkspaces.length > 1) {
        runningWorkspacesAlertItem.actionCallbacks = [
          {
            title: `Return to dashboard`,
            callback: () => this.handleOpenDashboard(key),
          },
        ];
      } else if (runningWorkspaces.length === 1) {
        const runningWorkspace = runningWorkspaces[0];
        runningWorkspacesAlertItem.actionCallbacks = [
          {
            title: `Close running workspace (${runningWorkspace.name}) and restart`,
            callback: () => this.handleStopRedundantWorkspace(key, runningWorkspace),
          },
          {
            title: `Switch to running workspace (${runningWorkspace.name}) to save any changes`,
            callback: () => this.handleSwitchToWorkspace(key, runningWorkspace),
          },
        ];
      }
      return runningWorkspacesAlertItem;
    }

    return {
      key,
      title: 'Failed to open the workspace',
      variant: AlertVariant.danger,
      children: common.helpers.errors.getMessage(error),
      actionCallbacks: [
        {
          title: 'Restart',
          callback: () => this.handleRestart(key),
        },
      ],
    };
  }

  render(): React.ReactNode {
    const { distance, hasChildren } = this.props;
    const { name, lastError } = this.state;

    const redundantWorkspace = this.findRedundantWorkspace(this.props, this.state);

    const isActive = distance === 0;
    const isError = lastError !== undefined;
    const isWarning = false;

    return (
      <React.Fragment>
        {isActive && (
          <TimeLimit
            timeLimitSec={TIMEOUT_TO_STOP_SEC}
            onTimeout={() => this.handleTimeout(redundantWorkspace)}
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
  runningDevWorkspacesLimitExceeded: selectRunningDevWorkspacesLimitExceeded(state),
  runningWorkspaces: selectRunningWorkspaces(state),
  runningWorkspacesLimit: selectRunningWorkspacesLimit(state),
});

const connector = connect(mapStateToProps, WorkspaceStore.actionCreators, null, {
  // forwardRef is mandatory for using `@react-mock/state` in unit tests
  forwardRef: true,
});
type MappedProps = ConnectedProps<typeof connector>;
export default connector(CommonStepCheckRunningWorkspacesLimit);
