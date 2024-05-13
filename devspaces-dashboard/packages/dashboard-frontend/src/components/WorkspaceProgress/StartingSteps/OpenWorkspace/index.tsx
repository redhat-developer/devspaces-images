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

import { TIMEOUT_TO_GET_URL_SEC } from '@/components/WorkspaceProgress/const';
import {
  ProgressStep,
  ProgressStepProps,
  ProgressStepState,
} from '@/components/WorkspaceProgress/ProgressStep';
import {
  applyRestartDefaultLocation,
  applyRestartInSafeModeLocation,
} from '@/components/WorkspaceProgress/StartingSteps/StartWorkspace/prepareRestart';
import { ProgressStepTitle } from '@/components/WorkspaceProgress/StepTitle';
import { TimeLimit } from '@/components/WorkspaceProgress/TimeLimit';
import { WorkspaceParams } from '@/Routes/routes';
import { isAvailableEndpoint } from '@/services/helpers/api-ping';
import { findTargetWorkspace } from '@/services/helpers/factoryFlow/findTargetWorkspace';
import { AlertItem, DevWorkspaceStatus, LoaderTab } from '@/services/helpers/types';
import { Workspace, WorkspaceAdapter } from '@/services/workspace-adapter';
import { AppState } from '@/store';
import { selectApplications } from '@/store/ClusterInfo/selectors';
import * as WorkspaceStore from '@/store/Workspaces';
import { selectAllWorkspaces } from '@/store/Workspaces/selectors';

export type Props = MappedProps &
  ProgressStepProps & {
    matchParams: WorkspaceParams | undefined;
  };
export type State = ProgressStepState;

class StartingStepOpenWorkspace extends ProgressStep<Props, State> {
  protected readonly name = 'Open IDE';

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

    if (this.state.lastError) {
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

  public componentWillUnmount(): void {
    this.toDispose.dispose();
  }

  public shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    // active step changed
    if (this.props.distance !== nextProps.distance) {
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
    return false;
  }

  protected handleRestart(alertKey: string, tab: LoaderTab): void {
    this.props.onHideError(alertKey);

    this.clearStepError();
    this.props.onRestart(tab);
  }

  protected handleTimeout(): void {
    const timeoutError = new Error(
      `The workspace has not received an IDE URL in the last ${TIMEOUT_TO_GET_URL_SEC} seconds. Try to re-open the workspace.`,
    );
    this.handleError(timeoutError);
  }

  protected async runStep(): Promise<boolean> {
    const { matchParams } = this.props;
    const workspace = this.findTargetWorkspace(this.props);

    if (matchParams === undefined) {
      throw new Error('Cannot determine the workspace to start.');
    }

    if (workspace === undefined) {
      throw new Error(
        `Workspace "${matchParams.namespace}/${matchParams.workspaceName}" not found.`,
      );
    }

    if (!workspace.isRunning) {
      if (
        workspace.status === DevWorkspaceStatus.FAILED ||
        workspace.status === DevWorkspaceStatus.TERMINATING
      ) {
        throw new Error(
          workspace.error || `The workspace status changed unexpectedly to "${workspace.status}".`,
        );
      }

      // it's possible for the workspace to be restarted before the IDE URL is available
      // in this case we need to wait for all conditions to be met
      return false;
    }

    if (!workspace.ideUrl) {
      // wait for the IDE url to be set
      return false;
    }

    const isAvailable = await isAvailableEndpoint(workspace.ideUrl);
    if (isAvailable) {
      window.location.replace(workspace.ideUrl);
      return true;
    }

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
      variant: AlertVariant.danger,
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
    const { distance, hasChildren } = this.props;
    const { name, lastError } = this.state;

    const isActive = distance === 0;
    const isError = false;
    const isWarning = lastError !== undefined;

    return (
      <React.Fragment>
        {isActive && (
          <TimeLimit timeLimitSec={TIMEOUT_TO_GET_URL_SEC} onTimeout={() => this.handleTimeout()} />
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
});

const connector = connect(mapStateToProps, WorkspaceStore.actionCreators, null, {
  // forwardRef is mandatory for using `@react-mock/state` in unit tests
  forwardRef: true,
});
type MappedProps = ConnectedProps<typeof connector>;
export default connector(StartingStepOpenWorkspace);
