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
import { LoaderPage } from '../../../../pages/Loader';
import { WorkspaceParams } from '../../../../Routes/routes';
import { delay } from '../../../../services/helpers/delay';
import { DisposableCollection } from '../../../../services/helpers/disposable';
import { buildHomeLocation, buildIdeLoaderLocation } from '../../../../services/helpers/location';
import { AlertItem, DevWorkspaceStatus, LoaderTab } from '../../../../services/helpers/types';
import { Workspace } from '../../../../services/workspace-adapter';
import { AppState } from '../../../../store';
import { selectRunningWorkspacesLimit } from '../../../../store/ClusterConfig/selectors';
import * as WorkspaceStore from '../../../../store/Workspaces';
import { RunningWorkspacesExceededError } from '../../../../store/Workspaces/devWorkspaces';
import { throwRunningWorkspacesExceededError } from '../../../../store/Workspaces/devWorkspaces/checkRunningWorkspacesLimit';
import { selectRunningDevWorkspacesLimitExceeded } from '../../../../store/Workspaces/devWorkspaces/selectors';
import {
  selectAllWorkspaces,
  selectRunningWorkspaces,
} from '../../../../store/Workspaces/selectors';
import { AbstractLoaderStep, LoaderStepProps, LoaderStepState } from '../../AbstractStep';
import { MIN_STEP_DURATION_MS, TIMEOUT_TO_STOP_SEC } from '../../const';
import findTargetWorkspace from '../../findTargetWorkspace';
import workspaceStatusIs from '../../workspaceStatusIs';
import { ToggleBarsContext } from '../../../../contexts/ToggleBars';

export type Props = MappedProps &
  LoaderStepProps & {
    matchParams: WorkspaceParams | undefined;
  };
export type State = LoaderStepState & {
  shouldStop: boolean; // should the loader to stop another workspace if the running workspaces limit is exceeded
  redundantWorkspaceUID?: string;
  stepTitle: string;
};

class StepCheckRunningWorkspacesLimit extends AbstractLoaderStep<Props, State> {
  static contextType = ToggleBarsContext;
  readonly context: React.ContextType<typeof ToggleBarsContext>;

  protected readonly toDispose = new DisposableCollection();

  constructor(props: Props) {
    super(props);

    const currentStep = this.props.loaderSteps.get(this.props.currentStepIndex).value;

    this.state = {
      shouldStop: false,
      stepTitle: currentStep.title,
    };
  }

  public componentDidMount() {
    this.init();
  }

  public async componentDidUpdate() {
    this.toDispose.dispose();

    this.init();
  }

  public shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    const workspace = this.findRedundantWorkspace(this.props, this.state);
    const nextWorkspace = this.findRedundantWorkspace(nextProps, nextState);

    // next step
    if (nextProps.currentStepIndex > this.props.currentStepIndex) {
      return true;
    }

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
    await delay(MIN_STEP_DURATION_MS);

    const { runningWorkspacesLimit } = this.props;
    const { shouldStop, redundantWorkspaceUID, lastError } = this.state;

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

    if (lastError) {
      // close alert notification and then continue the flow
      this.clearStepError();
      return false;
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
      this.appendToStepTitle(text);

      return true;
    }

    if (
      workspaceStatusIs(redundantWorkspace, DevWorkspaceStatus.STARTING, DevWorkspaceStatus.RUNNING)
    ) {
      try {
        await this.props.stopWorkspace(redundantWorkspace);

        this.appendToStepTitle(`, waiting for ${redundantWorkspace.name} to stop`);

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
      try {
        await this.waitForStepDone(TIMEOUT_TO_STOP_SEC);

        // do not switch to the next step
        return false;
      } catch (e) {
        throw new Error(
          `The workspace status remains "${redundantWorkspace.status}" in the last ${TIMEOUT_TO_STOP_SEC} seconds.`,
        );
      }
    }

    // switch to the next step
    return true;
  }

  private appendToStepTitle(text: string) {
    const { loaderSteps, currentStepIndex } = this.props;
    const { stepTitle } = this.state;

    const currentStep = loaderSteps.get(currentStepIndex).value;

    if (currentStep.title.endsWith(text)) {
      return;
    }

    const newTitle = stepTitle + text;
    currentStep.title = newTitle;
    this.forceUpdate();
  }

  protected handleRestart(tabName?: string): void {
    this.setState({
      shouldStop: true,
      redundantWorkspaceUID: undefined,
    });
    this.clearStepError();
    this.props.onRestart(tabName);
  }

  private handleOpenDashboard(): void {
    this.context.showAll();

    const homeLocation = buildHomeLocation();
    this.props.history.push(homeLocation);
  }

  private handleStopRedundantWorkspace(redundantWorkspace: Workspace): void {
    this.setState({
      redundantWorkspaceUID: redundantWorkspace.uid,
    });
  }

  private handleSwitchToWorkspace(workspace: Workspace): void {
    // update browsing context
    window.name = workspace.uid;

    const workspaceLoaderLocation = buildIdeLoaderLocation(workspace);
    this.props.history.push(workspaceLoaderLocation);
    this.props.history.go(0);
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

  private getAlertItem(error: unknown): AlertItem | undefined {
    const { runningWorkspaces } = this.props;

    if (error instanceof RunningWorkspacesExceededError) {
      const runningWorkspacesAlertItem: AlertItem = {
        key: 'ide-loader-start-workspace',
        title: 'Running workspace(s) found.',
        variant: AlertVariant.warning,
        children: common.helpers.errors.getMessage(error),
      };

      if (runningWorkspaces.length > 1) {
        runningWorkspacesAlertItem.actionCallbacks = [
          {
            title: `Return to dashboard`,
            callback: () => this.handleOpenDashboard(),
          },
        ];
      } else if (runningWorkspaces.length === 1) {
        const runningWorkspace = runningWorkspaces[0];
        runningWorkspacesAlertItem.actionCallbacks = [
          {
            title: `Close running workspace (${runningWorkspace.name}) and restart`,
            callback: () => this.handleStopRedundantWorkspace(runningWorkspace),
          },
          {
            title: `Switch to running workspace (${runningWorkspace.name}) to save any changes`,
            callback: () => this.handleSwitchToWorkspace(runningWorkspace),
          },
        ];
      }
      return runningWorkspacesAlertItem;
    }
    if (!error) {
      return;
    }
    return {
      key: 'ide-loader-start-workspace',
      title: 'Failed to open the workspace',
      variant: AlertVariant.danger,
      children: common.helpers.errors.getMessage(error),
      actionCallbacks: [
        {
          title: 'Restart',
          callback: () => this.handleRestart(),
        },
        {
          title: 'Open in Verbose mode',
          callback: () => this.handleRestart(LoaderTab[LoaderTab.Logs]),
        },
      ],
    };
  }

  render(): React.ReactNode {
    const { currentStepIndex, loaderSteps, tabParam } = this.props;
    const { lastError } = this.state;
    const workspace = this.findTargetWorkspace(this.props);

    const steps = loaderSteps.values;
    const currentStepId = loaderSteps.get(currentStepIndex).value.id;

    const alertItem = this.getAlertItem(lastError);

    return (
      <LoaderPage
        alertItem={alertItem}
        currentStepId={currentStepId}
        steps={steps}
        tabParam={tabParam}
        workspace={workspace}
        onTabChange={tab => this.handleTabChange(tab)}
      />
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
export default connector(StepCheckRunningWorkspacesLimit);
