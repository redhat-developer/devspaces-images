/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import React from 'react';
import { Provider } from 'react-redux';
import { Action, Store } from 'redux';
import { render, screen, waitFor, within } from '@testing-library/react';
import { StateMock } from '@react-mock/state';
import { ROUTE } from '../../../route.enum';
import { getMockRouterProps } from '../../../services/__mocks__/router';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';
import { DevWorkspaceBuilder } from '../../../store/__mocks__/devWorkspaceBuilder';
import IdeLoaderContainer, { TIMEOUT_TO_RUN_SEC, State } from '..';
import { Workspace } from '../../../services/workspace-adapter';
import { ActionCreators } from '../../../store/Workspaces';
import { AppThunk } from '../../../store';
import { IdeLoaderSteps } from '../../../components/Loader/Step';
import { ToggleBarsContext } from '../../../contexts/ToggleBars';

jest.mock('../../../pages/IdeLoader');

const mockStartWorkspace = jest.fn();
jest.mock('../../../store/Workspaces/index', () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  return {
    actionCreators: {
      startWorkspace:
        (workspace: Workspace): AppThunk<Action, Promise<void>> =>
        async (): Promise<void> => {
          return mockStartWorkspace();
        },
    } as ActionCreators,
  };
  /* eslint-enable @typescript-eslint/no-unused-vars */
});

describe('IDE Loader container, step START_WORKSPACE', () => {
  const namespace = 'che-user';
  const workspaceName = 'test-workspace';
  const stepId = IdeLoaderSteps.START_WORKSPACE.toString();
  const nextStepId = IdeLoaderSteps.OPEN_IDE.toString();
  let localState: State;

  beforeEach(() => {
    localState = {
      shouldStart: true,
      currentStepIndex: 1,
      matchParams: {
        namespace,
        workspaceName,
      },
    };

    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
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

    renderComponent(namespace, workspaceName, store, localState);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    // the workspace should be started
    await waitFor(() => expect(mockStartWorkspace).toHaveBeenCalled());

    const currentStep = screen.getByTestId(stepId);

    // no errors for this step
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');
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

    renderComponent(namespace, workspaceName, store, localState);

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

    renderComponent(namespace, workspaceName, store, localState);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    // the workspace should be started
    await waitFor(() => expect(mockStartWorkspace).toHaveBeenCalled());

    const currentStep = screen.getByTestId(stepId);

    // no errors for this step
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');
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

    renderComponent(namespace, workspaceName, store, localState);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    // should not start the workspace
    expect(mockStartWorkspace).not.toHaveBeenCalled();

    const currentStep = screen.getByTestId(stepId);

    // no errors for this step
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    // should switch to the next step
    await waitFor(() => expect(currentStepId.textContent).toEqual(nextStepId));
  });

  test('workspace is STARTING longer than TIMEOUT_TO_RUN_SEC seconds', async () => {
    const store = new FakeStoreBuilder()
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

    renderComponent(namespace, workspaceName, store, localState);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);

    // initially no errors
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    // wait a bit more than necessary to end the workspace run timeout
    const time = (TIMEOUT_TO_RUN_SEC + 1) * 1000;
    jest.advanceTimersByTime(time);

    // there should be the error message
    await waitFor(() => expect(hasError.textContent).toEqual('true'));

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to open the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual(
      'The workspace status remains "Starting" in the last 300 seconds.',
    );
  });

  test('workspace is STARTING then RUNNING', async () => {
    const store = new FakeStoreBuilder()
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

    const { reRenderComponent } = renderComponent(namespace, workspaceName, store, localState);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    // wait less than necessary to end the workspace run timeout
    const time = (TIMEOUT_TO_RUN_SEC - 1) * 1000;
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
    reRenderComponent(namespace, workspaceName, nextStore, localState);

    // switch to the next step
    await waitFor(() => expect(currentStepId.textContent).toEqual(nextStepId));
  });

  test('workspace is STARTING then STOPPING', async () => {
    const store = new FakeStoreBuilder()
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

    const { reRenderComponent } = renderComponent(namespace, workspaceName, store, localState);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    // wait less than necessary to end the workspace run timeout
    const time = (TIMEOUT_TO_RUN_SEC - 1) * 1000;
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
    reRenderComponent(namespace, workspaceName, nextStore, localState);

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
  });

  test('workspace is STARTING then STOPPED', async () => {
    const store = new FakeStoreBuilder()
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

    const { reRenderComponent } = renderComponent(namespace, workspaceName, store, localState);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    // wait less than necessary to end the workspace run timeout
    const time = (TIMEOUT_TO_RUN_SEC - 1) * 1000;
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
    reRenderComponent(namespace, workspaceName, nextStore, localState);

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
  });

  test('workspace is STARTING then FAILING', async () => {
    const store = new FakeStoreBuilder()
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

    const { reRenderComponent } = renderComponent(namespace, workspaceName, store, localState);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    // wait less than necessary to end the workspace run timeout
    const time = (TIMEOUT_TO_RUN_SEC - 1) * 1000;
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
    reRenderComponent(namespace, workspaceName, nextStore, localState);

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
  });

  test('workspace is STARTING then FAILED', async () => {
    const store = new FakeStoreBuilder()
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

    const { reRenderComponent } = renderComponent(namespace, workspaceName, store, localState);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    // wait less than necessary to end the workspace run timeout
    const time = (TIMEOUT_TO_RUN_SEC - 1) * 1000;
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
            .withStatus({ phase: 'FAILED' })
            .build(),
        ],
      })
      .build();
    reRenderComponent(namespace, workspaceName, nextStore, localState);

    // should report the error
    await waitFor(() => expect(hasError.textContent).toEqual('true'));

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to open the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual('The workspace status changed unexpectedly to "Failed".');

    // should not start the workspace
    jest.runAllTimers();
    await waitFor(() => expect(mockStartWorkspace).not.toHaveBeenCalled());
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

    renderComponent(namespace, workspaceName, store, localState);

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

    renderComponent(namespace, workspaceName, store, localState);

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

    renderComponent(namespace, workspaceName, store, localState);

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
  });
});

type RenderParams = Parameters<typeof getComponent>;
function getComponent(
  namespace: string,
  workspaceName: string,
  store: Store,
  localState: State,
): React.ReactElement {
  const props = getMockRouterProps(ROUTE.IDE_LOADER, { namespace, workspaceName });
  return (
    <Provider store={store}>
      <ToggleBarsContext.Provider
        value={{
          hideAll: jest.fn(),
          showAll: jest.fn(),
        }}
      >
        <StateMock state={localState}>
          <IdeLoaderContainer {...props} />
        </StateMock>
      </ToggleBarsContext.Provider>
    </Provider>
  );
}

function renderComponent(...args: RenderParams): {
  reRenderComponent: (...args: RenderParams) => void;
} {
  const res = render(getComponent(...args));

  return {
    reRenderComponent: (...args) => {
      res.rerender(getComponent(...args));
    },
  };
}
