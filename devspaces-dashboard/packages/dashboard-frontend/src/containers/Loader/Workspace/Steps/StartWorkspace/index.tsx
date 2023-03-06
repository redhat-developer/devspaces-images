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
import { LoaderPage } from '../../../../../pages/Loader';
import { WorkspaceParams } from '../../../../../Routes/routes';
import { delay } from '../../../../../services/helpers/delay';
import { DisposableCollection } from '../../../../../services/helpers/disposable';
import { AlertItem, DevWorkspaceStatus, LoaderTab } from '../../../../../services/helpers/types';
import { Workspace } from '../../../../../services/workspace-adapter';
import { AppState } from '../../../../../store';
import { selectStartTimeout } from '../../../../../store/ServerConfig/selectors';
import * as WorkspaceStore from '../../../../../store/Workspaces';
import { selectAllWorkspaces } from '../../../../../store/Workspaces/selectors';
import { AbstractLoaderStep, LoaderStepProps, LoaderStepState } from '../../../AbstractStep';
import { MIN_STEP_DURATION_MS } from '../../../const';
import findTargetWorkspace from '../../../findTargetWorkspace';
import workspaceStatusIs from '../../../workspaceStatusIs';

export type Props = MappedProps &
  LoaderStepProps & {
    matchParams: WorkspaceParams;
  };
export type State = LoaderStepState & {
  shouldStart: boolean; // should the loader start a workspace?
};

class StepStartWorkspace extends AbstractLoaderStep<Props, State> {
  protected readonly toDispose = new DisposableCollection();

  constructor(props: Props) {
    super(props);

    this.state = {
      shouldStart: true,
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
    const workspace = this.findTargetWorkspace(this.props);
    const nextWorkspace = this.findTargetWorkspace(nextProps);

    // next step
    if (nextProps.currentStepIndex > this.props.currentStepIndex) {
      return true;
    }
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
    const workspace = this.findTargetWorkspace(this.props);
    if ((workspace?.isStarting || workspace?.isRunning) && this.state.shouldStart) {
      // prevent a workspace being repeatedly restarted, once it's starting
      this.setState({
        shouldStart: false,
      });
    }

    this.prepareAndRun();
  }

  protected handleRestart(tabName?: string): void {
    this.setState({ shouldStart: true });
    this.clearStepError();
    this.props.onRestart(tabName);
  }

  /**
   * The resolved boolean indicates whether to go to the next step or not
   */
  protected async runStep(): Promise<boolean> {
    await delay(MIN_STEP_DURATION_MS);

    const { matchParams } = this.props;

    const workspace = this.findTargetWorkspace(this.props);

    if (!workspace) {
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
      const errorLogs = workspace.errorLogs.join('');
      throw new Error(
        errorLogs || `The workspace status changed unexpectedly to "${workspace.status}".`,
      );
    }

    if (workspace.isStarting) {
      try {
        await new Promise<void>((resolve, reject) => {
          const timeoutId = window.setTimeout(() => {
            reject();
          }, this.props.startTimeout * 1000);
          this.toDispose.push({
            dispose: () => {
              window.clearTimeout(timeoutId);
              resolve();
            },
          });
        });

        // do not switch to the next step
        return false;
      } catch (e) {
        throw new Error(
          `The workspace status remains "${workspace.status}" in the last ${this.props.startTimeout} seconds.`,
        );
      }
    }

    // start workspace
    if (
      this.state.shouldStart &&
      workspaceStatusIs(workspace, DevWorkspaceStatus.STOPPED, DevWorkspaceStatus.FAILED)
    ) {
      await this.props.startWorkspace(workspace);
      // do not switch to the next step
      return false;
    }

    // switch to the next step
    return true;
  }

  protected findTargetWorkspace(props: Props): Workspace | undefined {
    return findTargetWorkspace(props.allWorkspaces, props.matchParams);
  }

  private getAlertItem(error: unknown): AlertItem | undefined {
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
  startTimeout: selectStartTimeout(state),
});

const connector = connect(mapStateToProps, WorkspaceStore.actionCreators, null, {
  // forwardRef is mandatory for using `@react-mock/state` in unit tests
  forwardRef: true,
});
type MappedProps = ConnectedProps<typeof connector>;
export default connector(StepStartWorkspace);
