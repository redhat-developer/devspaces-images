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
import { AlertItem, LoaderTab } from '../../../../../services/helpers/types';
import { Workspace } from '../../../../../services/workspace-adapter';
import { AppState } from '../../../../../store';
import * as WorkspaceStore from '../../../../../store/Workspaces';
import { selectAllWorkspaces } from '../../../../../store/Workspaces/selectors';
import { AbstractLoaderStep, LoaderStepProps, LoaderStepState } from '../../../AbstractStep';
import { MIN_STEP_DURATION_MS, TIMEOUT_TO_GET_URL_SEC } from '../../../const';
import findTargetWorkspace from '../../../findTargetWorkspace';
import { isAvailableEndpoint } from '../../../../../services/helpers/api-ping';

export type Props = MappedProps &
  LoaderStepProps & {
    matchParams: WorkspaceParams;
  };
export type State = LoaderStepState;

class StepOpenWorkspace extends AbstractLoaderStep<Props, State> {
  protected readonly toDispose = new DisposableCollection();

  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  public componentDidMount() {
    this.prepareAndRun();
  }

  public async componentDidUpdate() {
    this.toDispose.dispose();

    this.prepareAndRun();
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

  protected handleRestart(tabName?: string): void {
    this.clearStepError();
    this.props.onRestart(tabName);
  }

  protected async runStep(): Promise<boolean> {
    await delay(MIN_STEP_DURATION_MS);
    const { matchParams } = this.props;
    const workspace = this.findTargetWorkspace(this.props);

    if (!workspace) {
      throw new Error(
        `Workspace "${matchParams.namespace}/${matchParams.workspaceName}" not found.`,
      );
    }

    if (!workspace.isRunning) {
      throw new Error(`The workspace status changed unexpectedly to "${workspace.status}".`);
    }
    if (!workspace.ideUrl) {
      // wait for the IDE url to be set
      try {
        await new Promise<void>((resolve, reject) => {
          const timeoutId = window.setTimeout(() => {
            reject();
          }, TIMEOUT_TO_GET_URL_SEC * 1000);
          this.toDispose.push({
            dispose: () => {
              window.clearTimeout(timeoutId);
              resolve();
            },
          });
        });
        return false;
      } catch (e) {
        throw new Error(
          `The workspace has not received an IDE URL in the last ${TIMEOUT_TO_GET_URL_SEC} seconds. Try to re-open the workspace.`,
        );
      }
    }

    const isAvailable = await isAvailableEndpoint(workspace.ideUrl);
    if (isAvailable) {
      window.location.replace(workspace.ideUrl);
      return true;
    }

    return false;
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
});

const connector = connect(mapStateToProps, WorkspaceStore.actionCreators, null, {
  // forwardRef is mandatory for using `@react-mock/state` in unit tests
  forwardRef: true,
});
type MappedProps = ConnectedProps<typeof connector>;
export default connector(StepOpenWorkspace);
