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
import { ROUTE } from '../../../route.enum';
import { getMockRouterProps } from '../../../services/__mocks__/router';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';
import { DevWorkspaceBuilder } from '../../../store/__mocks__/devWorkspaceBuilder';
import { CheWorkspaceBuilder } from '../../../store/__mocks__/cheWorkspaceBuilder';
import { WorkspaceAdapter } from '../../../services/workspace-adapter';
import { ActionCreators } from '../../../store/Workspaces';
import { AppThunk } from '../../../store';
import { IdeLoaderSteps } from '../../../components/Loader/Step';
import IdeLoaderContainer, { TIMEOUT_TO_STOP_SEC } from '..';
import { ToggleBarsContext } from '../../../contexts/ToggleBars';

jest.mock('../../../pages/IdeLoader');

jest.mock('../../../store/Workspaces/index', () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  return {
    actionCreators: {
      requestWorkspaces: (): AppThunk<Action, Promise<void>> => async (): Promise<void> => {
        return Promise.resolve();
      },
    } as ActionCreators,
  };
  /* eslint-enable @typescript-eslint/no-unused-vars */
});

describe('IDE Loader container, step INITIALIZING', () => {
  const namespace = 'che-user';
  const workspaceName = 'test-workspace';
  const stepId = IdeLoaderSteps.INITIALIZING.toString();
  const nextStepId = IdeLoaderSteps.START_WORKSPACE.toString();

  beforeEach(() => {
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

    renderComponent(namespace, wrongWorkspaceName, store);

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
  });

  test('deprecated workspace', async () => {
    const deprecatedId = 'che-wksp-id';
    WorkspaceAdapter.setDeprecatedUIDs([deprecatedId]);
    const store = new FakeStoreBuilder()
      .withCheWorkspaces({
        workspaces: [
          new CheWorkspaceBuilder()
            .withId(deprecatedId)
            .withName(workspaceName)
            .withNamespace(namespace)
            .build(),
        ],
      })
      .withWorkspacesSettings({
        'che.devworkspaces.enabled': 'true',
      })
      .build();

    renderComponent(namespace, workspaceName, store);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('true');

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to open the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual(
      'The workspace is deprecated. Convert the workspace and try again.',
    );
  });

  test('workspace is STOPPING longer than TIMEOUT_TO_STOP_SEC seconds', async () => {
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

    renderComponent(namespace, workspaceName, store);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);

    // initially no errors
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    // wait a bit more than necessary to end the workspace stop timeout
    const time = (TIMEOUT_TO_STOP_SEC + 1) * 1000;
    jest.advanceTimersByTime(time);

    // there should be the error
    await waitFor(() => expect(hasError.textContent).toEqual('true'));

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to open the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual(
      'The workspace status remains "Stopping" in the last 60 seconds.',
    );
  });

  test('workspace is STOPPING then STOPPED', async () => {
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

    const { reRenderComponent } = renderComponent(namespace, workspaceName, store);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    // wait less than necessary to end the workspace stop timeout
    const time = (TIMEOUT_TO_STOP_SEC - 1) * 1000;
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
    reRenderComponent(namespace, workspaceName, nextStore);

    // switch to the next step
    await waitFor(() => expect(currentStepId.textContent).toEqual(nextStepId));
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

    renderComponent(namespace, workspaceName, store);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);

    // no errors for the current step
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    // switch to the next step
    await waitFor(() => expect(currentStepId.textContent).toEqual(nextStepId));
  });

  test('workspace is FAILING longer than TIMEOUT_TO_STOP_SEC seconds', async () => {
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

    renderComponent(namespace, workspaceName, store);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);

    // initially no errors
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    // wait a bit more than necessary to end the workspace stop timeout
    const time = (TIMEOUT_TO_STOP_SEC + 1) * 1000;
    jest.advanceTimersByTime(time);

    // there should be the error
    await waitFor(() => expect(hasError.textContent).toEqual('true'));

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to open the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual(
      'The workspace status remains "Failing" in the last 60 seconds.',
    );
  });

  test('workspace is FAILING then FAILED', async () => {
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

    const { reRenderComponent } = renderComponent(namespace, workspaceName, store);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    // wait less than necessary to end the workspace stop timeout
    const time = (TIMEOUT_TO_STOP_SEC - 1) * 1000;
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
    reRenderComponent(namespace, workspaceName, nextStore);

    // switch to the next step
    await waitFor(() => expect(currentStepId.textContent).toEqual(nextStepId));
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

    renderComponent(namespace, workspaceName, store);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);

    // no errors on the current step
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    // switch to the next step
    await waitFor(() => expect(currentStepId.textContent).toEqual(nextStepId));
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

    renderComponent(namespace, workspaceName, store);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('true');

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to open the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual('The workspace is terminating and cannot be open.');
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

    renderComponent(namespace, workspaceName, store);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);

    // no errors for the current step
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    // switch to the next step
    await waitFor(() => expect(currentStepId.textContent).toEqual(nextStepId));
  });

  test('workspace is STARTING', async () => {
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

    renderComponent(namespace, workspaceName, store);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);

    // no errors for the current step
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    // switch to the next step
    await waitFor(() => expect(currentStepId.textContent).toEqual(nextStepId));
  });
});

type RenderParams = Parameters<typeof getComponent>;
function getComponent(namespace: string, workspaceName: string, store: Store): React.ReactElement {
  const props = getMockRouterProps(ROUTE.IDE_LOADER, { namespace, workspaceName });
  return (
    <Provider store={store}>
      <ToggleBarsContext.Provider
        value={{
          hideAll: jest.fn(),
          showAll: jest.fn(),
        }}
      >
        <IdeLoaderContainer {...props} />
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
