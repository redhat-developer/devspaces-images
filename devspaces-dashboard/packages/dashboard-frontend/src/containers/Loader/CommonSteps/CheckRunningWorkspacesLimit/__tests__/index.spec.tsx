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

import { StateMock } from '@react-mock/state';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { Action, Store } from 'redux';
import StepCheckRunningWorkspacesLimit, { State } from '..';
import { List, LoaderStep, LoadingStep } from '../../../../../components/Loader/Step';
import {
  buildLoaderSteps,
  getWorkspaceLoadingSteps,
} from '../../../../../components/Loader/Step/buildSteps';
import { WorkspaceParams } from '../../../../../Routes/routes';
import devfileApi from '../../../../../services/devfileApi';
import { constructWorkspace } from '../../../../../services/workspace-adapter';
import getComponentRenderer from '../../../../../services/__mocks__/getComponentRenderer';
import { AppThunk } from '../../../../../store';
import { ActionCreators } from '../../../../../store/Workspaces';
import { DevWorkspaceBuilder } from '../../../../../store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '../../../../../store/__mocks__/storeBuilder';
import { MIN_STEP_DURATION_MS, TIMEOUT_TO_STOP_SEC } from '../../../const';

jest.mock('../../../../../pages/Loader');

const mockStartWorkspace = jest.fn();
const mockStopWorkspace = jest.fn();
jest.mock('../../../../../store/Workspaces/index', () => {
  return {
    actionCreators: {
      startWorkspace:
        (...args: Parameters<ActionCreators['startWorkspace']>): AppThunk<Action, Promise<void>> =>
        async (): Promise<void> => {
          return mockStartWorkspace(...args);
        },
      stopWorkspace:
        (...args: Parameters<ActionCreators['startWorkspace']>): AppThunk<Action, Promise<void>> =>
        async (): Promise<void> => {
          return mockStopWorkspace(...args);
        },
    } as ActionCreators,
  };
});

const mockOnNextStep = jest.fn();
const mockOnRestart = jest.fn();
const mockOnTabChange = jest.fn();

const history = createMemoryHistory();

const { renderComponent } = getComponentRenderer(getComponent);

const namespace = 'che-user';

const workspaceName = 'test-workspace';
const matchParams: WorkspaceParams = {
  namespace,
  workspaceName,
};
const targetDevworkspace = new DevWorkspaceBuilder()
  .withName(workspaceName)
  .withNamespace(namespace)
  .build();

const stepId = LoadingStep.CHECK_RUNNING_WORKSPACES_LIMIT.toString();
const currentStepIndex = 1;
const loadingSteps = getWorkspaceLoadingSteps();

describe('Workspace Loader, step CHECK_RUNNING_WORKSPACES_LIMIT', () => {
  let loaderSteps: List<LoaderStep>;
  let runningDevworkspaceBuilder1: DevWorkspaceBuilder;
  let runningDevworkspaceBuilder2: DevWorkspaceBuilder;
  let stoppedDevworkspaceBuilder: DevWorkspaceBuilder;

  beforeEach(() => {
    runningDevworkspaceBuilder1 = new DevWorkspaceBuilder()
      .withName('wksp-1')
      .withStatus({ phase: 'RUNNING' })
      .withSpec({ started: true })
      .withNamespace(namespace);
    runningDevworkspaceBuilder2 = new DevWorkspaceBuilder()
      .withName('wksp-2')
      .withStatus({ phase: 'RUNNING' })
      .withSpec({ started: true })
      .withNamespace(namespace);
    stoppedDevworkspaceBuilder = new DevWorkspaceBuilder()
      .withName('wksp-3')
      .withStatus({ phase: 'STOPPED' })
      .withSpec({ started: false })
      .withNamespace(namespace);

    loaderSteps = buildLoaderSteps(loadingSteps);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  test('number of running workspaces is below the limit', async () => {
    const runningDevworkspace = runningDevworkspaceBuilder1.build();
    const stoppedDevworkspace = stoppedDevworkspaceBuilder.build();
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [runningDevworkspace, stoppedDevworkspace],
      })
      .withClusterConfig({
        runningWorkspacesLimit: 2,
      })
      .build();

    renderComponent(store, loaderSteps);
    jest.runOnlyPendingTimers();

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);
    const hasError = within(currentStep).getByTestId('hasError');

    await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());

    // no error alert should appear
    expect(hasError.textContent).toEqual('false');
  });

  describe('limit of running workspaces equals 1', () => {
    let store: Store;
    let runningDevworkspace: devfileApi.DevWorkspace;
    let stoppedDevworkspace: devfileApi.DevWorkspace;

    beforeEach(() => {
      runningDevworkspace = runningDevworkspaceBuilder1.build();
      stoppedDevworkspace = stoppedDevworkspaceBuilder.build();
      store = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [targetDevworkspace, runningDevworkspace, stoppedDevworkspace],
        })
        .withClusterConfig({
          runningWorkspacesLimit: 1,
        })
        .build();
    });

    it('should not switch to the next step', async () => {
      renderComponent(store, loaderSteps);
      jest.runOnlyPendingTimers();

      const currentStepId = screen.getByTestId('current-step-id');
      await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

      const currentStep = screen.getByTestId(stepId);
      const hasError = within(currentStep).getByTestId('hasError');
      await waitFor(() => expect(hasError.textContent).toEqual('true'));

      jest.runAllTimers();

      expect(mockOnNextStep).not.toHaveBeenCalled();
    });

    test('error notification', async () => {
      renderComponent(store, loaderSteps);
      jest.runOnlyPendingTimers();

      const currentStepId = screen.getByTestId('current-step-id');
      await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

      const currentStep = screen.getByTestId(stepId);
      const hasError = within(currentStep).getByTestId('hasError');
      await waitFor(() => expect(hasError.textContent).toEqual('true'));

      const alertTitle = screen.getByTestId('alert-title');
      expect(alertTitle.textContent).toEqual('Running workspace(s) found.');

      const alertBody = screen.getByTestId('alert-body');
      expect(alertBody.textContent).toEqual('You can only have 1 running workspace at a time.');

      jest.runOnlyPendingTimers();
    });

    test('action links text', async () => {
      renderComponent(store, loaderSteps);
      jest.runOnlyPendingTimers();

      const currentStepId = screen.getByTestId('current-step-id');
      await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

      const currentStep = screen.getByTestId(stepId);
      const hasError = within(currentStep).getByTestId('hasError');
      await waitFor(() => expect(hasError.textContent).toEqual('true'));

      const closeRunningWorkspaceButton = screen.queryByText(
        `Close running workspace (${runningDevworkspace.metadata.name}) and restart`,
      );
      expect(closeRunningWorkspaceButton).not.toBeNull();

      const switchToRunningWorkspaceLink = screen.queryByText(
        `Switch to running workspace (${runningDevworkspace.metadata.name}) to save any changes`,
      );
      expect(switchToRunningWorkspaceLink).not.toBeNull();

      jest.runOnlyPendingTimers();
    });

    it('should stop the redundant workspace and close the error alert', async () => {
      renderComponent(store, loaderSteps);
      jest.runOnlyPendingTimers();

      const currentStepId = screen.getByTestId('current-step-id');
      await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

      const currentStep = screen.getByTestId(stepId);
      const hasError = within(currentStep).getByTestId('hasError');
      await waitFor(() => expect(hasError.textContent).toEqual('true'));

      // jest.runOnlyPendingTimers();

      const closeRunningWorkspaceLink = screen.getByRole('button', {
        name: /Close running workspace/,
      });

      userEvent.click(closeRunningWorkspaceLink);
      await waitFor(() => expect(mockStopWorkspace).toHaveBeenCalled());

      // alert should be closed
      await waitFor(() => expect(hasError.textContent).toEqual('false'));

      jest.runOnlyPendingTimers();
    });

    describe('trying to stop the redundant workspace', () => {
      let localState: Partial<State>;
      let redundantDevworkspace: devfileApi.DevWorkspace;

      beforeEach(() => {
        redundantDevworkspace = runningDevworkspaceBuilder1
          .withStatus({ phase: 'STOPPING' })
          .build();
        localState = {
          shouldStop: true,
          redundantWorkspaceUID: constructWorkspace(redundantDevworkspace).uid,
        };
      });

      test('the workspace is STOPPING more than TIMEOUT_TO_STOP_SEC seconds', async () => {
        mockStopWorkspace.mockResolvedValue(undefined);

        renderComponent(store, loaderSteps, localState);
        jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

        const currentStepId = screen.getByTestId('current-step-id');
        await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

        const currentStep = screen.getByTestId(stepId);

        // wait a bit more than necessary to end the workspace stop timeout
        const time = (TIMEOUT_TO_STOP_SEC + 1) * 1000;
        jest.advanceTimersByTime(time);

        // an error alert should appear
        const hasError = within(currentStep).getByTestId('hasError');
        await waitFor(() => expect(hasError.textContent).toEqual('true'));

        jest.runOnlyPendingTimers();

        const alertTitle = screen.getByTestId('alert-title');
        expect(alertTitle.textContent).toEqual('Failed to open the workspace');

        const alertBody = screen.getByTestId('alert-body');
        expect(alertBody.textContent).toEqual(
          'The workspace status remains "Stopping" in the last 60 seconds.',
        );

        expect(mockOnNextStep).not.toHaveBeenCalled();
      });

      test('the workspace is STOPPING then STOPPED', async () => {
        mockStopWorkspace.mockResolvedValue(undefined);

        store = new FakeStoreBuilder()
          .withDevWorkspaces({
            workspaces: [targetDevworkspace, redundantDevworkspace, stoppedDevworkspace],
          })
          .withClusterConfig({
            runningWorkspacesLimit: 1,
          })
          .build();
        const { reRenderComponent } = renderComponent(store, loaderSteps);
        jest.runOnlyPendingTimers();

        // wait a bit less than necessary to end the workspace stop timeout
        const time = (TIMEOUT_TO_STOP_SEC - 1) * 1000;
        jest.advanceTimersByTime(time);

        const nextRedundantDevworkspace = runningDevworkspaceBuilder1
          .withStatus({ phase: 'STOPPED' })
          .withSpec({ started: false })
          .build();
        const nextStore = new FakeStoreBuilder()
          .withDevWorkspaces({
            workspaces: [targetDevworkspace, nextRedundantDevworkspace, stoppedDevworkspace],
          })
          .build();
        reRenderComponent(nextStore, loaderSteps, localState);
        jest.runOnlyPendingTimers();

        const currentStepId = screen.getByTestId('current-step-id');
        await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

        jest.runOnlyPendingTimers();

        const currentStep = screen.getByTestId(stepId);
        const hasError = within(currentStep).getByTestId('hasError');

        // no error alert should appear
        await waitFor(() => expect(hasError.textContent).toEqual('false'));

        // switch to the next step
        await waitFor(() => expect(mockOnNextStep).toBeCalled());
      });
    });

    it('should switch to the running workspace', async () => {
      renderComponent(store, loaderSteps);
      jest.runOnlyPendingTimers();

      const currentStepId = screen.getByTestId('current-step-id');
      await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

      const currentStep = screen.getByTestId(stepId);
      const hasError = within(currentStep).getByTestId('hasError');
      await waitFor(() => expect(hasError.textContent).toEqual('true'));

      jest.runOnlyPendingTimers();

      const switchToRunningWorkspaceLink = screen.getByRole('button', {
        name: /Switch to running workspace/,
      });

      const spyHistoryPush = jest.spyOn(history, 'push');

      userEvent.click(switchToRunningWorkspaceLink);

      await waitFor(() =>
        expect(spyHistoryPush).toHaveBeenCalledWith(
          expect.objectContaining({
            pathname: `/ide/${namespace}/${runningDevworkspace.metadata.name}`,
          }),
        ),
      );
    });
  });

  describe('limit of running workspaces equals 2', () => {
    let store: Store;
    let runningDevworkspace1: devfileApi.DevWorkspace;
    let runningDevworkspace2: devfileApi.DevWorkspace;
    let stoppedDevworkspace: devfileApi.DevWorkspace;

    beforeEach(() => {
      runningDevworkspace1 = runningDevworkspaceBuilder1.build();
      runningDevworkspace2 = runningDevworkspaceBuilder2.build();
      stoppedDevworkspace = stoppedDevworkspaceBuilder.build();
      store = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [
            targetDevworkspace,
            runningDevworkspace1,
            runningDevworkspace2,
            stoppedDevworkspace,
          ],
        })
        .withClusterConfig({
          runningWorkspacesLimit: 2,
        })
        .build();
    });

    it('should not switch to the next step', async () => {
      renderComponent(store, loaderSteps);
      jest.runOnlyPendingTimers();

      const currentStepId = screen.getByTestId('current-step-id');
      await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

      const currentStep = screen.getByTestId(stepId);
      const hasError = within(currentStep).getByTestId('hasError');
      await waitFor(() => expect(hasError.textContent).toEqual('true'));

      jest.runAllTimers();

      expect(mockOnNextStep).not.toHaveBeenCalled();
    });

    test('error notification', async () => {
      renderComponent(store, loaderSteps);
      jest.runOnlyPendingTimers();

      const currentStepId = screen.getByTestId('current-step-id');
      await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

      const currentStep = screen.getByTestId(stepId);
      const hasError = within(currentStep).getByTestId('hasError');
      await waitFor(() => expect(hasError.textContent).toEqual('true'));

      const alertTitle = screen.getByTestId('alert-title');
      expect(alertTitle.textContent).toEqual('Running workspace(s) found.');

      const alertBody = screen.getByTestId('alert-body');
      expect(alertBody.textContent).toEqual('You can only have 2 running workspaces at a time.');
    });

    test('action link text', async () => {
      renderComponent(store, loaderSteps);
      jest.runOnlyPendingTimers();

      const currentStepId = screen.getByTestId('current-step-id');
      await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

      const currentStep = screen.getByTestId(stepId);
      const hasError = within(currentStep).getByTestId('hasError');
      await waitFor(() => expect(hasError.textContent).toEqual('true'));

      const openDashboardLink = screen.queryByText('Return to dashboard');
      expect(openDashboardLink).not.toBeNull();
    });

    it('should return to dashboard', async () => {
      renderComponent(store, loaderSteps);
      jest.runOnlyPendingTimers();

      const currentStepId = screen.getByTestId('current-step-id');
      await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

      const currentStep = screen.getByTestId(stepId);
      const hasError = within(currentStep).getByTestId('hasError');
      await waitFor(() => expect(hasError.textContent).toEqual('true'));

      const openDashboardLink = screen.getByRole('button', {
        name: 'Return to dashboard',
      });

      const spyHistoryPush = jest.spyOn(history, 'push');

      userEvent.click(openDashboardLink);

      await waitFor(() =>
        expect(spyHistoryPush).toHaveBeenCalledWith(
          expect.objectContaining({
            pathname: `/`,
          }),
        ),
      );
    });
  });
});

function getComponent(
  store: Store,
  loaderSteps: List<LoaderStep>,
  localState?: Partial<State>,
): React.ReactElement {
  const component = (
    <StepCheckRunningWorkspacesLimit
      currentStepIndex={currentStepIndex}
      history={history}
      loaderSteps={loaderSteps}
      matchParams={matchParams}
      tabParam={undefined}
      onNextStep={mockOnNextStep}
      onRestart={mockOnRestart}
      onTabChange={mockOnTabChange}
    />
  );
  if (localState) {
    return (
      <Provider store={store}>
        <StateMock state={localState}>{component}</StateMock>
      </Provider>
    );
  } else {
    return <Provider store={store}>{component}</Provider>;
  }
}
