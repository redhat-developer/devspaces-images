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

import common, { ApplicationId } from '@eclipse-che/common';
import { AlertVariant } from '@patternfly/react-core';
import { isEqual } from 'lodash';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import {
  ProgressStep,
  ProgressStepProps,
  ProgressStepState,
} from '@/components/WorkspaceProgress/ProgressStep';
import {
  applyRestartDefaultLocation,
  applyRestartInSafeModeLocation,
  getStartParams,
  resetRestartInSafeModeLocation,
} from '@/components/WorkspaceProgress/StartingSteps/StartWorkspace/prepareRestart';
import { ProgressStepTitle } from '@/components/WorkspaceProgress/StepTitle';
import { TimeLimit } from '@/components/WorkspaceProgress/TimeLimit';
import workspaceStatusIs from '@/components/WorkspaceProgress/workspaceStatusIs';
import { lazyInject } from '@/inversify.config';
import { WorkspaceParams } from '@/Routes/routes';
import { AppAlerts } from '@/services/alerts/appAlerts';
import { findTargetWorkspace } from '@/services/helpers/factoryFlow/findTargetWorkspace';
import { AlertItem, DevWorkspaceStatus, LoaderTab } from '@/services/helpers/types';
import { Workspace, WorkspaceAdapter } from '@/services/workspace-adapter';
import { AppState } from '@/store';
import { selectApplications } from '@/store/ClusterInfo/selectors';
import { selectStartTimeout } from '@/store/ServerConfig/selectors';
import * as WorkspaceStore from '@/store/Workspaces';
import { selectDevWorkspaceWarnings } from '@/store/Workspaces/devWorkspaces/selectors';
import { selectAllWorkspaces } from '@/store/Workspaces/selectors';

export type Props = MappedProps &
  ProgressStepProps & {
    matchParams: WorkspaceParams | undefined;
  };
export type State = ProgressStepState & {
  shouldStart: boolean; // should the loader start a workspace?
  shouldUpdateWithDefaultDevfile: boolean;
  warning: string | undefined;
};

class StartingStepStartWorkspace extends ProgressStep<Props, State> {
  protected readonly name = 'Waiting for workspace to start';

  @lazyInject(AppAlerts)
  private readonly appAlerts: AppAlerts;

  constructor(props: Props) {
    super(props);

    this.state = {
      warning: undefined,
      shouldStart: true,
      name: this.name,
      shouldUpdateWithDefaultDevfile: false,
    };
  }

  public componentDidMount() {
    this.init();
  }

  public async componentDidUpdate() {
    const safeMode = resetRestartInSafeModeLocation(this.props.history.location);
    if (safeMode) {
      this.setState({ shouldUpdateWithDefaultDevfile: safeMode });
      return;
    }

    this.init();
  }

  public shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    // active step changed
    if (this.props.distance !== nextProps.distance) {
      return true;
    }

    // show/hide spinner near the step title
    if (this.props.hasChildren !== nextProps.hasChildren) {
      return true;
    }

    const workspace = this.findTargetWorkspace(this.props);
    const nextWorkspace = this.findTargetWorkspace(nextProps);

    // change workspace status, etc.
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

    if (this.state.shouldUpdateWithDefaultDevfile !== nextState.shouldUpdateWithDefaultDevfile) {
      return true;
    }

    if (this.props.history.location.search !== nextProps.history.location.search) {
      return true;
    }

    if (
      workspace !== undefined &&
      nextWorkspace !== undefined &&
      this.props.devWorkspaceWarnings[workspace.uid] !==
        nextProps.devWorkspaceWarnings[nextWorkspace.uid]
    ) {
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

    const workspace = this.findTargetWorkspace(this.props);
    if ((workspace?.isStarting || workspace?.isRunning) && this.state.shouldStart) {
      // prevent a workspace being repeatedly restarted, once it's starting
      this.setState({
        shouldStart: false,
      });
    }

    if (workspace !== undefined) {
      const warning = this.props.devWorkspaceWarnings[workspace.uid];
      if (warning) {
        this.setState({
          warning,
        });
      }
    }

    this.prepareAndRun();
  }

  protected handleRestart(alertKey: string, tab: LoaderTab): void {
    this.props.onHideError(alertKey);

    this.setState({ shouldStart: true });
    this.clearStepError();
    this.props.onRestart(tab);
  }

  protected handleTimeout(workspace: Workspace | undefined): void {
    const message =
      workspace === undefined
        ? 'Cannot determine the workspace to start.'
        : `The workspace status remains "${workspace.status}" in the last ${this.props.startTimeout} seconds.`;
    const timeoutError = new Error(message);
    this.handleError(timeoutError);
  }

  /**
   * The resolved boolean indicates whether to go to the next step or not
   */
  protected async runStep(): Promise<boolean> {
    const { matchParams } = this.props;
    if (matchParams === undefined) {
      throw new Error('Cannot determine the workspace to start.');
    }

    const workspace = this.findTargetWorkspace(this.props);

    if (workspace === undefined) {
      throw new Error(
        `Workspace "${matchParams.namespace}/${matchParams.workspaceName}" not found.`,
      );
    }

    if (this.state.warning !== undefined) {
      this.appAlerts.showAlert({
        key: 'start-workspace-warning',
        title: `WARNING: ${this.state.warning}`,
        variant: AlertVariant.warning,
      });
      return true;
    }

    if (this.state.shouldUpdateWithDefaultDevfile) {
      await this.props.updateWorkspaceWithDefaultDevfile(workspace);
      this.setState({ shouldUpdateWithDefaultDevfile: false });
      return false;
    }

    if (
      workspaceStatusIs(workspace, DevWorkspaceStatus.TERMINATING) ||
      (this.state.shouldStart === false && workspaceStatusIs(workspace, DevWorkspaceStatus.FAILED))
    ) {
      throw new Error(
        workspace.error || `The workspace status changed unexpectedly to "${workspace.status}".`,
      );
    }

    if (workspace.isRunning) {
      // switch to the next step
      return true;
    }

    // start workspace
    if (
      this.state.shouldStart &&
      workspaceStatusIs(workspace, DevWorkspaceStatus.STOPPED, DevWorkspaceStatus.FAILED)
    ) {
      await this.props.startWorkspace(workspace, getStartParams(this.props.history.location));
    }

    // do not switch to the next step
    return false;
  }

  protected findTargetWorkspace(props: Props): Workspace | undefined {
    if (props.matchParams === undefined) {
      return;
    }
    return findTargetWorkspace(props.allWorkspaces, props.matchParams);
  }

  protected buildAlertItem(error: Error): AlertItem {
    const key = this.name;
    const actionCallbacks = [
      {
        title: 'Restart',
        callback: () => {
          applyRestartDefaultLocation(this.props.history.location);
          this.handleRestart(key, LoaderTab.Progress);
        },
      },
      {
        title: 'Restart with default devfile',
        callback: () => {
          applyRestartInSafeModeLocation(this.props.history.location);
          this.handleRestart(key, LoaderTab.Progress);
        },
      },
    ];

    const isOpenshift = this.props.applications.length === 1;
    if (isOpenshift) {
      actionCallbacks.push({
        title: 'Edit the DevWorkspace spec',
        callback: () => {
          this.openDevWorkspaceClusterConsole();
        },
      });
    }

    return {
      key,
      title: 'Failed to open the workspace',
      variant: AlertVariant.warning,
      children: common.helpers.errors.getMessage(error),
      actionCallbacks,
    };
  }

  private openDevWorkspaceClusterConsole(): void {
    const { applications } = this.props;
    const workspace = this.findTargetWorkspace(this.props);

    const clusterConsole = applications.find(app => app.id === ApplicationId.CLUSTER_CONSOLE);

    if (!clusterConsole || !workspace) {
      return;
    }

    const devWorkspaceConsoleUrl = WorkspaceAdapter.buildClusterConsoleUrl(
      workspace.ref,
      clusterConsole.url,
    );

    const target = 'devWorkspaceSpec' + workspace.uid;

    window.open(`${devWorkspaceConsoleUrl}/yaml`, target);
  }

  render(): React.ReactNode {
    const { distance, hasChildren, startTimeout } = this.props;
    const { name, lastError } = this.state;

    const isActive = distance === 0;
    const isError = false;
    const isWarning = lastError !== undefined;

    const workspace = this.findTargetWorkspace(this.props);

    return (
      <React.Fragment>
        {isActive && (
          <TimeLimit timeLimitSec={startTimeout} onTimeout={() => this.handleTimeout(workspace)} />
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
  applications: selectApplications(state),
  startTimeout: selectStartTimeout(state),
  devWorkspaceWarnings: selectDevWorkspaceWarnings(state),
});

const connector = connect(mapStateToProps, WorkspaceStore.actionCreators, null, {
  // forwardRef is mandatory for using `@react-mock/state` in unit tests
  forwardRef: true,
});
type MappedProps = ConnectedProps<typeof connector>;
export default connector(StartingStepStartWorkspace);
