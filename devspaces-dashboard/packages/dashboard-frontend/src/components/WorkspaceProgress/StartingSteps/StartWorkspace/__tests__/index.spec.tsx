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

import { api } from '@eclipse-che/common';
import { screen, waitFor } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { Action, Store } from 'redux';

import { MIN_STEP_DURATION_MS } from '@/components/WorkspaceProgress/const';
import { WorkspaceParams } from '@/Routes/routes';
import getComponentRenderer from '@/services/__mocks__/getComponentRenderer';
import { getDefer } from '@/services/helpers/deferred';
import { AlertItem } from '@/services/helpers/types';
import { AppThunk } from '@/store';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { ActionCreators } from '@/store/Workspaces';

import StartingStepStartWorkspace from '..';

jest.mock('@/components/WorkspaceProgress/TimeLimit');

const mockStartWorkspace = jest.fn();
jest.mock('@/store/Workspaces/index', () => {
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
const mockOnError = jest.fn();
const mockOnHideError = jest.fn();

const { renderComponent } = getComponentRenderer(getComponent);

const namespace = 'che-user';
const workspaceName = 'test-workspace';
const matchParams: WorkspaceParams = {
  namespace,
  workspaceName,
};

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
  defaultNamespace: {
    autoProvision: true,
  },
  cheNamespace: '',
  devfileRegistry: {
    disableInternalRegistry: false,
    externalDevfileRegistries: [],
  },
  pluginRegistryURL: '',
  pluginRegistryInternalURL: '',
};

describe('Starting steps, starting a workspace', () => {
  let user: UserEvent;

  beforeEach(() => {
    jest.useFakeTimers();

    user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('workspace not found', () => {
    const wrongWorkspaceName = 'wrong-workspace-name';
    let store: Store;
    let paramsWithWrongName: WorkspaceParams;

    beforeEach(() => {
      store = new FakeStoreBuilder()
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

      paramsWithWrongName = {
        namespace,
        workspaceName: wrongWorkspaceName,
      };
    });

    test('alert notification', async () => {
      renderComponent(store, paramsWithWrongName);

      await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

      const expectAlertItem = expect.objectContaining({
        title: 'Failed to open the workspace',
        children: `Workspace "${namespace}/${wrongWorkspaceName}" not found.`,
        actionCallbacks: [
          expect.objectContaining({
            title: 'Restart',
            callback: expect.any(Function),
          }),
          expect.objectContaining({
            title: 'Restart with default devfile',
            callback: expect.any(Function),
          }),
        ],
      });
      await waitFor(() => expect(mockOnError).toHaveBeenCalledWith(expectAlertItem));

      expect(mockOnNextStep).not.toHaveBeenCalled();
      expect(mockOnRestart).not.toHaveBeenCalled();
    });

    test('action callback to restart', async () => {
      // this deferred object will help run the callback at the right time
      const deferred = getDefer();

      const actionTitle = 'Restart';
      mockOnError.mockImplementationOnce((alertItem: AlertItem) => {
        const action = alertItem.actionCallbacks?.find(action =>
          action.title.startsWith(actionTitle),
        );
        expect(action).toBeDefined();

        if (action) {
          deferred.promise.then(action.callback);
        } else {
          throw new Error('Action not found');
        }
      });
      renderComponent(store, paramsWithWrongName);
      await jest.runAllTimersAsync();

      await waitFor(() => expect(mockOnError).toHaveBeenCalled());
      mockOnError.mockClear();
      expect(mockOnNextStep).not.toHaveBeenCalled();
      expect(mockOnRestart).not.toHaveBeenCalled();

      /* test the action */
      deferred.resolve();

      // resolve deferred to trigger the callback
      await jest.runOnlyPendingTimersAsync();

      // this mock is called from the action callback above
      await waitFor(() => expect(mockOnRestart).toHaveBeenCalled());
      expect(mockOnNextStep).not.toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();
    });
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

    renderComponent(store);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    // the workspace should be started
    await waitFor(() => expect(mockStartWorkspace).toHaveBeenCalled());

    // no errors for this step
    expect(mockOnError).not.toHaveBeenCalled();

    expect(mockOnNextStep).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();
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
    const errorMessage = `You're not allowed to run more workspaces`;
    mockStartWorkspace.mockRejectedValueOnce(errorMessage);

    renderComponent(store);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    // should call the workspace start mock
    await waitFor(() => expect(mockStartWorkspace).toHaveBeenCalled());

    // should show the error
    const expectAlertItem = expect.objectContaining({
      title: 'Failed to open the workspace',
      children: errorMessage,
      actionCallbacks: [
        expect.objectContaining({
          title: 'Restart',
          callback: expect.any(Function),
        }),
        expect.objectContaining({
          title: 'Restart with default devfile',
          callback: expect.any(Function),
        }),
      ],
    });
    await waitFor(() => expect(mockOnError).toHaveBeenCalledWith(expectAlertItem));

    expect(mockOnNextStep).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();
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

    renderComponent(store);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    // the workspace should be started
    await waitFor(() => expect(mockStartWorkspace).toHaveBeenCalled());

    // no errors for this step
    expect(mockOnError).not.toHaveBeenCalled();

    expect(mockOnNextStep).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();
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

    renderComponent(store);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    // should switch to the next step
    await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());

    // should not start the workspace
    expect(mockStartWorkspace).not.toHaveBeenCalled();

    // no errors for this step
    expect(mockOnError).not.toHaveBeenCalled();

    expect(mockOnRestart).not.toHaveBeenCalled();
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

    const { reRenderComponent } = renderComponent(store);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    // no errors at this moment
    expect(mockOnError).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();
    expect(mockOnNextStep).not.toHaveBeenCalled();

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
    reRenderComponent(nextStore);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    // switch to the next step
    await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
    expect(mockOnError).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();
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

    const { reRenderComponent } = renderComponent(store);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    // no errors at this moment
    expect(mockOnError).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();
    expect(mockOnNextStep).not.toHaveBeenCalled();

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
    reRenderComponent(nextStore);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    // should not report any error
    expect(mockOnError).not.toHaveBeenCalled();

    // should not start the workspace
    expect(mockStartWorkspace).not.toHaveBeenCalled();

    expect(mockOnNextStep).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();
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

    const { reRenderComponent } = renderComponent(store);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    // no errors at this moment
    expect(mockOnError).not.toHaveBeenCalled();

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
    reRenderComponent(nextStore);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    // should not report any error
    expect(mockOnError).not.toHaveBeenCalled();

    expect(mockStartWorkspace).not.toHaveBeenCalled();
    expect(mockOnNextStep).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();
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

    const { reRenderComponent } = renderComponent(store);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    // no errors at this moment
    expect(mockOnError).not.toHaveBeenCalled();

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
    reRenderComponent(nextStore);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    // should report the error
    const expectAlertItem = expect.objectContaining({
      title: 'Failed to open the workspace',
      children: 'The workspace status changed unexpectedly to "Failed".',
      actionCallbacks: [
        expect.objectContaining({
          title: 'Restart',
          callback: expect.any(Function),
        }),
        expect.objectContaining({
          title: 'Restart with default devfile',
          callback: expect.any(Function),
        }),
      ],
    });
    await waitFor(() => expect(mockOnError).toHaveBeenCalledWith(expectAlertItem));

    // should not start the workspace
    expect(mockStartWorkspace).not.toHaveBeenCalled();

    expect(mockOnNextStep).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();
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

    renderComponent(store);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    // should not report any error
    expect(mockOnError).not.toHaveBeenCalled();

    expect(mockOnNextStep).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();
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

    renderComponent(store);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    // should not report any error
    expect(mockOnError).not.toHaveBeenCalled();

    expect(mockOnNextStep).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();
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

    renderComponent(store);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    // should report the error
    const expectAlertItem = expect.objectContaining({
      title: 'Failed to open the workspace',
      children: 'The workspace status changed unexpectedly to "Terminating".',
      actionCallbacks: [
        expect.objectContaining({
          title: 'Restart',
          callback: expect.any(Function),
        }),
        expect.objectContaining({
          title: 'Restart with default devfile',
          callback: expect.any(Function),
        }),
      ],
    });
    await waitFor(() => expect(mockOnError).toHaveBeenCalledWith(expectAlertItem));

    expect(mockOnNextStep).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();
  });

  describe('step timeout reached', () => {
    let store: Store;

    beforeEach(() => {
      store = new FakeStoreBuilder()
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
    });

    test('notification alert', async () => {
      renderComponent(store);
      jest.runAllTimers();

      // trigger timeout
      const timeoutButton = screen.getByRole('button', {
        name: 'onTimeout',
      });
      await user.click(timeoutButton);

      const expectAlertItem = expect.objectContaining({
        title: 'Failed to open the workspace',
        children: 'The workspace status remains "Starting" in the last 300 seconds.',
        actionCallbacks: [
          expect.objectContaining({
            title: 'Restart',
            callback: expect.any(Function),
          }),
          expect.objectContaining({
            title: 'Restart with default devfile',
            callback: expect.any(Function),
          }),
        ],
      });
      await waitFor(() => expect(mockOnError).toHaveBeenCalledWith(expectAlertItem));

      expect(mockOnNextStep).not.toHaveBeenCalled();
      expect(mockOnRestart).not.toHaveBeenCalled();
    });

    test('action callback to restart', async () => {
      // this deferred object will help run the callback at the right time
      const deferred = getDefer();

      const actionTitle = 'Restart';
      mockOnError.mockImplementationOnce((alertItem: AlertItem) => {
        const action = alertItem.actionCallbacks?.find(action =>
          action.title.startsWith(actionTitle),
        );
        expect(action).toBeDefined();

        if (action) {
          deferred.promise.then(action.callback);
        } else {
          throw new Error('Action not found');
        }
      });

      renderComponent(store);
      await jest.runAllTimersAsync();

      // trigger timeout
      const timeoutButton = screen.getByRole('button', {
        name: 'onTimeout',
      });
      await user.click(timeoutButton);

      await waitFor(() => expect(mockOnError).toHaveBeenCalled());
      mockOnError.mockClear();
      expect(mockOnRestart).not.toHaveBeenCalled();
      expect(mockOnNextStep).not.toHaveBeenCalled();

      /* test the action */

      // resolve deferred to trigger the callback
      deferred.resolve();
      await jest.runOnlyPendingTimersAsync();

      await waitFor(() => expect(mockOnRestart).toHaveBeenCalled());
      expect(mockOnNextStep).not.toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();
    });
  });
});

function getComponent(
  store: Store,
  params: { namespace: string; workspaceName: string } = matchParams,
): React.ReactElement {
  const history = createMemoryHistory();
  return (
    <Provider store={store}>
      <StartingStepStartWorkspace
        distance={0}
        hasChildren={true}
        history={history}
        matchParams={params}
        onNextStep={mockOnNextStep}
        onRestart={mockOnRestart}
        onError={mockOnError}
        onHideError={mockOnHideError}
      />
    </Provider>
  );
}
