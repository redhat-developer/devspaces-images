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
import { WorkspaceParams } from '../../../../Routes/routes';
import { delay } from '../../../../services/helpers/delay';
import { DisposableCollection } from '../../../../services/helpers/disposable';
import { findTargetWorkspace } from '../../../../services/helpers/factoryFlow/findTargetWorkspace';
import { AlertItem, DevWorkspaceStatus, LoaderTab } from '../../../../services/helpers/types';
import { Workspace } from '../../../../services/workspace-adapter';
import { AppState } from '../../../../store';
import { selectStartTimeout } from '../../../../store/ServerConfig/selectors';
import * as WorkspaceStore from '../../../../store/Workspaces';
import { selectAllWorkspaces } from '../../../../store/Workspaces/selectors';
import { MIN_STEP_DURATION_MS } from '../../const';
import { ProgressStep, ProgressStepProps, ProgressStepState } from '../../ProgressStep';
import { ProgressStepTitle } from '../../StepTitle';
import { TimeLimit } from '../../TimeLimit';
import workspaceStatusIs from '../../workspaceStatusIs';

export type Props = MappedProps &
  ProgressStepProps & {
    matchParams: WorkspaceParams | undefined;
  };
export type State = ProgressStepState & {
  shouldStart: boolean; // should the loader start a workspace?
};

class StartingStepStartWorkspace extends ProgressStep<Props, State> {
  protected readonly name = 'Waiting for workspace to start';
  protected readonly toDispose = new DisposableCollection();

  constructor(props: Props) {
    super(props);

    this.state = {
      shouldStart: true,
      name: this.name,
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
    await delay(MIN_STEP_DURATION_MS);

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

    if (
      workspaceStatusIs(
        workspace,
        DevWorkspaceStatus.TERMINATING,
        DevWorkspaceStatus.STOPPING,
        DevWorkspaceStatus.FAILING,
      ) ||
      (this.state.shouldStart === false &&
        workspaceStatusIs(workspace, DevWorkspaceStatus.STOPPED, DevWorkspaceStatus.FAILED))
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
      await this.props.startWorkspace(workspace);
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
    return {
      key,
      title: 'Failed to open the workspace',
      variant: AlertVariant.danger,
      children: common.helpers.errors.getMessage(error),
      actionCallbacks: [
        {
          title: 'Restart',
          callback: () => this.handleRestart(key, LoaderTab.Progress),
        },
        {
          title: 'Open in Verbose mode',
          callback: () => this.handleRestart(key, LoaderTab.Logs),
        },
      ],
    };
  }

  render(): React.ReactNode {
    const { distance, startTimeout } = this.props;
    const { name, lastError } = this.state;

    const isActive = distance === 0;
    const isError = lastError !== undefined;
    const isWarning = false;

    const workspace = this.findTargetWorkspace(this.props);

    return (
      <React.Fragment>
        {isActive && (
          <TimeLimit timeLimitSec={startTimeout} onTimeout={() => this.handleTimeout(workspace)} />
        )}
        <ProgressStepTitle distance={distance} isError={isError} isWarning={isWarning}>
          {name}
        </ProgressStepTitle>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  allWorkspaces: selectAllWorkspaces(state),
  startTimeout: selectStartTimeout(state),
});

const connector = connect(mapStateToProps, WorkspaceStore.actionCreators, null, {
  // forwardRef is mandatory for using `@react-mock/state` in unit tests
  forwardRef: true,
});
type MappedProps = ConnectedProps<typeof connector>;
export default connector(StartingStepStartWorkspace);
