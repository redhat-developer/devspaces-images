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

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import StartingStepOpenWorkspace from '..';
import { WorkspaceParams } from '../../../../../Routes/routes';
import { getDefer } from '../../../../../services/helpers/deferred';
import { AlertItem } from '../../../../../services/helpers/types';
import getComponentRenderer from '../../../../../services/__mocks__/getComponentRenderer';
import { DevWorkspaceBuilder } from '../../../../../store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '../../../../../store/__mocks__/storeBuilder';
import { MIN_STEP_DURATION_MS, TIMEOUT_TO_GET_URL_SEC } from '../../../const';

jest.mock('../../../TimeLimit');

const isAvailableEndpointMock = jest.fn();
jest.mock('../../../../../services/helpers/api-ping', () => ({
  isAvailableEndpoint: (url: string | undefined) => isAvailableEndpointMock(url),
}));

const { renderComponent } = getComponentRenderer(getComponent);

const mockOnNextStep = jest.fn();
const mockOnRestart = jest.fn();
const mockOnError = jest.fn();
const mockOnHideError = jest.fn();

const mockLocationReplace = jest.fn();

const namespace = 'che-user';
const workspaceName = 'test-workspace';
const matchParams: WorkspaceParams = {
  namespace,
  workspaceName,
};

describe('Starting steps, opening an editor', () => {
  beforeEach(() => {
    delete (window as any).location;
    (window.location as any) = { replace: mockLocationReplace };

    jest.useFakeTimers();
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

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      const expectAlertItem = expect.objectContaining({
        title: 'Failed to open the workspace',
        children: `Workspace "${namespace}/${wrongWorkspaceName}" not found.`,
        actionCallbacks: [
          expect.objectContaining({
            title: 'Restart',
            callback: expect.any(Function),
          }),
          expect.objectContaining({
            title: 'Open in Verbose mode',
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
      jest.runAllTimers();

      await waitFor(() => expect(mockOnError).toHaveBeenCalled());
      mockOnError.mockClear();
      expect(mockOnNextStep).not.toHaveBeenCalled();
      expect(mockOnRestart).not.toHaveBeenCalled();

      /* test the action */

      // resolve deferred to trigger the callback
      deferred.resolve();

      // this mock is called from the action callback above
      await waitFor(() => expect(mockOnRestart).toHaveBeenCalled());
      expect(mockOnNextStep).not.toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();
    });
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

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    // should report the error
    const expectAlertItem = expect.objectContaining({
      title: 'Failed to open the workspace',
      children: 'The workspace status changed unexpectedly to "Failing".',
      actionCallbacks: [
        expect.objectContaining({
          title: 'Restart',
          callback: expect.any(Function),
        }),
        expect.objectContaining({
          title: 'Open in Verbose mode',
          callback: expect.any(Function),
        }),
      ],
    });
    await waitFor(() => expect(mockOnError).toHaveBeenCalledWith(expectAlertItem));

    expect(mockOnNextStep).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();
  });

  describe('with available endpoint', () => {
    beforeEach(() => {
      isAvailableEndpointMock.mockResolvedValue(Promise.resolve(true));
    });

    test('mainUrl is present', async () => {
      const store = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [
            new DevWorkspaceBuilder()
              .withName(workspaceName)
              .withNamespace(namespace)
              .withStatus({ phase: 'RUNNING', mainUrl: 'main-url' })
              .build(),
          ],
        })
        .build();

      renderComponent(store);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      // wait for opening IDE url
      await waitFor(() => expect(mockLocationReplace).toHaveBeenCalledWith('main-url'));
    });

    test(`mainUrl is propagated after some time`, async () => {
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

      const { reRenderComponent } = renderComponent(store);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      // no errors at this moment
      expect(mockOnError).not.toHaveBeenCalled();

      const nextStore = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [
            new DevWorkspaceBuilder()
              .withName(workspaceName)
              .withNamespace(namespace)
              .withStatus({ phase: 'RUNNING', mainUrl: 'main-url' })
              .build(),
          ],
        })
        .build();
      reRenderComponent(nextStore);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      // wait for opening IDE url
      await waitFor(() => expect(mockLocationReplace).toHaveBeenCalledWith('main-url'));

      expect(mockOnError).not.toHaveBeenCalled();
    });
  });

  describe('without available endpoint', () => {
    beforeEach(() => {
      isAvailableEndpointMock.mockResolvedValue(Promise.resolve(false));
    });

    test('mainUrl is present', async () => {
      const store = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [
            new DevWorkspaceBuilder()
              .withName(workspaceName)
              .withNamespace(namespace)
              .withStatus({ phase: 'RUNNING', mainUrl: 'main-url' })
              .build(),
          ],
        })
        .build();

      renderComponent(store);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      // IDE is not opened
      expect(mockLocationReplace).not.toHaveBeenCalled();
    });

    test('mainUrl is propagated after some time', async () => {
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

      const { reRenderComponent } = renderComponent(store);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      // no errors at this moment
      expect(mockOnError).not.toHaveBeenCalled();

      const nextStore = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [
            new DevWorkspaceBuilder()
              .withName(workspaceName)
              .withNamespace(namespace)
              .withStatus({ phase: 'RUNNING', mainUrl: 'main-url' })
              .build(),
          ],
        })
        .build();
      reRenderComponent(nextStore);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      // IDE is not opened
      expect(mockLocationReplace).not.toHaveBeenCalled();
    });
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
      userEvent.click(timeoutButton);

      const expectAlertItem = expect.objectContaining({
        title: 'Failed to open the workspace',
        children: `The workspace has not received an IDE URL in the last ${TIMEOUT_TO_GET_URL_SEC} seconds. Try to re-open the workspace.`,
        actionCallbacks: [
          expect.objectContaining({
            title: 'Restart',
            callback: expect.any(Function),
          }),
          expect.objectContaining({
            title: 'Open in Verbose mode',
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
      jest.runAllTimers();

      // trigger timeout
      const timeoutButton = screen.getByRole('button', {
        name: 'onTimeout',
      });
      userEvent.click(timeoutButton);

      await waitFor(() => expect(mockOnError).toHaveBeenCalled());
      mockOnError.mockClear();
      expect(mockOnRestart).not.toHaveBeenCalled();
      expect(mockOnNextStep).not.toHaveBeenCalled();

      /* test the action */

      // resolve deferred to trigger the callback
      deferred.resolve();

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
      <StartingStepOpenWorkspace
        distance={0}
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
