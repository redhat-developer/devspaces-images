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

import { api } from '@eclipse-che/common';
import { StateMock } from '@react-mock/state';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { Action, Store } from 'redux';
import StepStartWorkspace, { State } from '..';
import { List, LoaderStep, LoadingStep } from '../../../../../../components/Loader/Step';
import {
  buildLoaderSteps,
  getWorkspaceLoadingSteps,
} from '../../../../../../components/Loader/Step/buildSteps';
import { WorkspaceParams } from '../../../../../../Routes/routes';
import getComponentRenderer from '../../../../../../services/__mocks__/getComponentRenderer';
import { AppThunk } from '../../../../../../store';
import { ActionCreators } from '../../../../../../store/Workspaces';
import { DevWorkspaceBuilder } from '../../../../../../store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '../../../../../../store/__mocks__/storeBuilder';
import { MIN_STEP_DURATION_MS } from '../../../../const';

jest.mock('../../../../../../pages/Loader');

const mockStartWorkspace = jest.fn();
jest.mock('../../../../../../store/Workspaces/index', () => {
  return {
    actionCreators: {
      startWorkspace:
        (...args: Parameters<ActionCreators['startWorkspace']>): AppThunk<Action, Promise<void>> =>
        async (): Promise<void> => {
          return mockStartWorkspace(...args);
        },
    } as ActionCreators,
  };
});

const mockOnNextStep = jest.fn();
const mockOnRestart = jest.fn();
const mockOnTabChange = jest.fn();

const { renderComponent } = getComponentRenderer(getComponent);

const namespace = 'che-user';
const workspaceName = 'test-workspace';
const matchParams: WorkspaceParams = {
  namespace,
  workspaceName,
};

const stepId = LoadingStep.START_WORKSPACE.toString();
const currentStepIndex = 2;
const loadingSteps = getWorkspaceLoadingSteps();
const startTimeout = 300;
const serverConfig: api.IServerConfig = {
  containerBuild: {},
  defaults: {
    editor: undefined,
    components: [],
    plugins: [],
    pvcStrategy: '',
  },
  pluginRegistry: {
    openVSXURL: '',
  },
  timeouts: {
    inactivityTimeout: -1,
    runTimeout: -1,
    startTimeout,
  },
  cheNamespace: '',
  devfileRegistry: {
    disableInternalRegistry: false,
    externalDevfileRegistries: [],
  },
  devfileRegistryURL: '',
  devfileRegistryInternalURL: '',
  pluginRegistryURL: '',
  pluginRegistryInternalURL: '',
};

describe('Workspace Loader, step START_WORKSPACE', () => {
  let loaderSteps: List<LoaderStep>;

  beforeEach(() => {
    loaderSteps = buildLoaderSteps(loadingSteps);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  test('workspace not found', async () => {
    const wrongWorkspaceName = 'wrong-workspace-name';
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(workspaceName)
            .withNamespace(namespace)
            .withStatus({ phase: 'STOPPING' })
            .build(),
        ],
      })
      .build();

    const paramsWithWrongName: WorkspaceParams = {
      namespace,
      workspaceName: wrongWorkspaceName,
    };
    renderComponent(store, loaderSteps, paramsWithWrongName);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('true');

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to open the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual(
      `Workspace "${namespace}/${wrongWorkspaceName}" not found.`,
    );

    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('workspace is STOPPED', async () => {
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(workspaceName)
            .withNamespace(namespace)
            .withStatus({ phase: 'STOPPED' })
            .build(),
        ],
      })
      .build();

    renderComponent(store, loaderSteps);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    // the workspace should be started
    await waitFor(() => expect(mockStartWorkspace).toHaveBeenCalled());

    const currentStep = screen.getByTestId(stepId);

    // no errors for this step
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('workspace is STOPPED and it fails to start', async () => {
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(workspaceName)
            .withNamespace(namespace)
            .withStatus({ phase: 'STOPPED' })
            .build(),
        ],
      })
      .build();

    // the workspace start fails with the following message
    const message = `You're not allowed to run more workspaces`;
    mockStartWorkspace.mockRejectedValueOnce(message);

    renderComponent(store, loaderSteps);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    // should call the workspace start mock
    await waitFor(() => expect(mockStartWorkspace).toHaveBeenCalled());

    const currentStep = screen.getByTestId(stepId);

    // should show the error
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('true');

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to open the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual(message);

    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('workspace is FAILED', async () => {
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(workspaceName)
            .withNamespace(namespace)
            .withStatus({ phase: 'FAILED' })
            .build(),
        ],
      })
      .build();

    renderComponent(store, loaderSteps);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    // the workspace should be started
    await waitFor(() => expect(mockStartWorkspace).toHaveBeenCalled());

    const currentStep = screen.getByTestId(stepId);

    // no errors for this step
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('workspace is RUNNING', async () => {
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(workspaceName)
            .withNamespace(namespace)
            .withStatus({ phase: 'RUNNING' })
            .build(),
        ],
      })
      .build();

    renderComponent(store, loaderSteps);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    // should not start the workspace
    expect(mockStartWorkspace).not.toHaveBeenCalled();

    const currentStep = screen.getByTestId(stepId);

    // no errors for this step
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    // should switch to the next step
    await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
  });

  test('workspace is STARTING more than TIMEOUT_TO_RUN_SEC seconds', async () => {
    const store = new FakeStoreBuilder()
      .withDwServerConfig(serverConfig)
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(workspaceName)
            .withNamespace(namespace)
            .withStatus({ phase: 'STARTING' })
            .build(),
        ],
      })
      .build();

    renderComponent(store, loaderSteps);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);

    // initially no errors
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    // wait a bit more than necessary to end the workspace run timeout
    const time = (startTimeout + 1) * 1000;
    jest.advanceTimersByTime(time);

    // there should be the error message
    await waitFor(() => expect(hasError.textContent).toEqual('true'));

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to open the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual(
      'The workspace status remains "Starting" in the last 300 seconds.',
    );

    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('workspace is STARTING then RUNNING', async () => {
    const store = new FakeStoreBuilder()
      .withDwServerConfig(serverConfig)
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(workspaceName)
            .withNamespace(namespace)
            .withStatus({ phase: 'STARTING' })
            .build(),
        ],
      })
      .build();

    const { reRenderComponent } = renderComponent(store, loaderSteps);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    // wait less than necessary to end the workspace run timeout
    const time = (startTimeout - 1) * 1000;
    jest.advanceTimersByTime(time);

    const currentStep = screen.getByTestId(stepId);

    // no errors at this moment
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    const nextStore = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(workspaceName)
            .withNamespace(namespace)
            .withStatus({ phase: 'RUNNING' })
            .build(),
        ],
      })
      .build();
    reRenderComponent(nextStore, loaderSteps);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    // switch to the next step
    await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
  });

  test('workspace is STARTING then STOPPING', async () => {
    const store = new FakeStoreBuilder()
      .withDwServerConfig(serverConfig)
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(workspaceName)
            .withNamespace(namespace)
            .withStatus({ phase: 'STARTING' })
            .build(),
        ],
      })
      .build();

    const { reRenderComponent } = renderComponent(store, loaderSteps);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    // wait less than necessary to end the workspace run timeout
    const time = (startTimeout - 1) * 1000;
    jest.advanceTimersByTime(time);

    const currentStep = screen.getByTestId(stepId);

    // no errors at this moment
    const hasError = within(currentStep).getByTestId('hasError');
    await waitFor(() => expect(hasError.textContent).toEqual('false'));

    const nextStore = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(workspaceName)
            .withNamespace(namespace)
            .withStatus({ phase: 'STOPPING' })
            .build(),
        ],
      })
      .build();
    reRenderComponent(nextStore, loaderSteps);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    // should report the error
    await waitFor(() => expect(hasError.textContent).toEqual('true'));

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to open the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual(
      'The workspace status changed unexpectedly to "Stopping".',
    );

    // should not start the workspace
    jest.runAllTimers();
    await waitFor(() => expect(mockStartWorkspace).not.toHaveBeenCalled());

    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('workspace is STARTING then STOPPED', async () => {
    const store = new FakeStoreBuilder()
      .withDwServerConfig(serverConfig)
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(workspaceName)
            .withNamespace(namespace)
            .withStatus({ phase: 'STARTING' })
            .build(),
        ],
      })
      .build();

    const { reRenderComponent } = renderComponent(store, loaderSteps);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    // wait less than necessary to end the workspace run timeout
    const time = (startTimeout - 1) * 1000;
    jest.advanceTimersByTime(time);

    const currentStep = screen.getByTestId(stepId);

    // no errors at this moment
    const hasError = within(currentStep).getByTestId('hasError');
    await waitFor(() => expect(hasError.textContent).toEqual('false'));

    const nextStore = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(workspaceName)
            .withNamespace(namespace)
            .withStatus({ phase: 'STOPPED' })
            .build(),
        ],
      })
      .build();
    reRenderComponent(nextStore, loaderSteps);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    // should report the error
    await waitFor(() => expect(hasError.textContent).toEqual('true'));

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to open the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual(
      'The workspace status changed unexpectedly to "Stopped".',
    );

    // should not start the workspace
    jest.runAllTimers();
    await waitFor(() => expect(mockStartWorkspace).not.toHaveBeenCalled());

    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('workspace is STARTING then FAILING', async () => {
    const store = new FakeStoreBuilder()
      .withDwServerConfig(serverConfig)
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(workspaceName)
            .withNamespace(namespace)
            .withStatus({ phase: 'STARTING' })
            .build(),
        ],
      })
      .build();

    const { reRenderComponent } = renderComponent(store, loaderSteps);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    // wait less than necessary to end the workspace run timeout
    const time = (startTimeout - 1) * 1000;
    jest.advanceTimersByTime(time);

    const currentStep = screen.getByTestId(stepId);

    // no errors at this moment
    const hasError = within(currentStep).getByTestId('hasError');
    await waitFor(() => expect(hasError.textContent).toEqual('false'));

    const nextStore = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(workspaceName)
            .withNamespace(namespace)
            .withStatus({ phase: 'FAILING' })
            .build(),
        ],
      })
      .build();
    reRenderComponent(nextStore, loaderSteps);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    // should report the error
    await waitFor(() => expect(hasError.textContent).toEqual('true'));

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to open the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual(
      'The workspace status changed unexpectedly to "Failing".',
    );

    // should not start the workspace
    jest.runAllTimers();
    await waitFor(() => expect(mockStartWorkspace).not.toHaveBeenCalled());

    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('workspace is STARTING then FAILED', async () => {
    const store = new FakeStoreBuilder()
      .withDwServerConfig(serverConfig)
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(workspaceName)
            .withNamespace(namespace)
            .withStatus({ phase: 'STARTING' })
            .build(),
        ],
      })
      .build();

    const { reRenderComponent } = renderComponent(store, loaderSteps);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    // wait less than necessary to end the workspace run timeout
    const time = (startTimeout - 1) * 1000;
    jest.advanceTimersByTime(time);

    const currentStep = screen.getByTestId(stepId);

    // no errors at this moment
    const hasError = within(currentStep).getByTestId('hasError');
    await waitFor(() => expect(hasError.textContent).toEqual('false'));

    const nextStore = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(workspaceName)
            .withNamespace(namespace)
            .withStatus({
              phase: 'FAILED',
              message: 'Some error message...',
            })
            .build(),
        ],
      })
      .build();
    reRenderComponent(nextStore, loaderSteps);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    // should report the error
    await waitFor(() => expect(hasError.textContent).toEqual('true'));

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to open the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual('Some error message...');

    // should not start the workspace
    jest.runAllTimers();
    await waitFor(() => expect(mockStartWorkspace).not.toHaveBeenCalled());

    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('workspace is FAILING', async () => {
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(workspaceName)
            .withNamespace(namespace)
            .withStatus({ phase: 'FAILING' })
            .build(),
        ],
      })
      .build();

    renderComponent(store, loaderSteps);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);

    // should report the error
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('true');

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to open the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual(
      'The workspace status changed unexpectedly to "Failing".',
    );

    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('workspace is STOPPING', async () => {
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(workspaceName)
            .withNamespace(namespace)
            .withStatus({ phase: 'STOPPING' })
            .build(),
        ],
      })
      .build();

    renderComponent(store, loaderSteps);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);

    // should report the error
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('true');

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to open the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual(
      'The workspace status changed unexpectedly to "Stopping".',
    );

    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('workspace is TERMINATING', async () => {
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(workspaceName)
            .withNamespace(namespace)
            .withStatus({ phase: 'TERMINATING' })
            .build(),
        ],
      })
      .build();

    renderComponent(store, loaderSteps);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);

    // should report the error
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('true');

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to open the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual(
      'The workspace status changed unexpectedly to "Terminating".',
    );

    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('restart flow', async () => {
    const localState: Partial<State> = {
      shouldStart: false,
      lastError: new Error('The workspace failed to start.'),
    };
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(workspaceName)
            .withNamespace(namespace)
            .withStatus({ phase: 'FAILED' })
            .build(),
        ],
      })
      .build();

    renderComponent(store, loaderSteps, matchParams, localState);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const restartButton = await screen.findByRole('button', {
      name: 'Restart',
    });
    expect(restartButton).toBeDefined();
    userEvent.click(restartButton);

    expect(mockOnRestart).toHaveBeenCalled();
  });
});

function getComponent(
  store: Store,
  loaderSteps: List<LoaderStep>,
  params: { namespace: string; workspaceName: string } = matchParams,
  localState?: Partial<State>,
): React.ReactElement {
  const history = createMemoryHistory();
  const component = (
    <StepStartWorkspace
      currentStepIndex={currentStepIndex}
      history={history}
      loaderSteps={loaderSteps}
      matchParams={params}
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
