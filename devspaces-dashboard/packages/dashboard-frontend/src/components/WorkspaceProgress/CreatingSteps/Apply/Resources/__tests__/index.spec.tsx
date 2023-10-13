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
import { createMemoryHistory, MemoryHistory } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { Action, Store } from 'redux';

import { MIN_STEP_DURATION_MS, TIMEOUT_TO_CREATE_SEC } from '@/components/WorkspaceProgress/const';
import prepareResources from '@/components/WorkspaceProgress/CreatingSteps/Apply/Resources/prepareResources';
import { ROUTE } from '@/Routes/routes';
import getComponentRenderer from '@/services/__mocks__/getComponentRenderer';
import devfileApi from '@/services/devfileApi';
import { getDefer } from '@/services/helpers/deferred';
import {
  DEV_WORKSPACE_ATTR,
  FACTORY_URL_ATTR,
  POLICIES_CREATE_ATTR,
} from '@/services/helpers/factoryFlow/buildFactoryParams';
import { AlertItem } from '@/services/helpers/types';
import { AppThunk } from '@/store';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { DevWorkspaceResources } from '@/store/DevfileRegistries';
import { ActionCreators } from '@/store/Workspaces/devWorkspaces';

import CreatingStepApplyResources from '..';

jest.mock('../../../../TimeLimit');
jest.mock('../prepareResources.ts');

const mockCreateWorkspaceFromResources = jest.fn().mockResolvedValue(undefined);
jest.mock('../../../../../../store/Workspaces/devWorkspaces', () => {
  return {
    actionCreators: {
      createWorkspaceFromResources:
        (
          ...args: Parameters<ActionCreators['createWorkspaceFromResources']>
        ): AppThunk<Action, Promise<void>> =>
        async (): Promise<void> =>
          mockCreateWorkspaceFromResources(...args),
    } as ActionCreators,
  };
});

const { renderComponent } = getComponentRenderer(getComponent);
let history: MemoryHistory;

const mockOnNextStep = jest.fn();
const mockOnRestart = jest.fn();
const mockOnError = jest.fn();
const mockOnHideError = jest.fn();

const resourcesUrl = 'https://resources-url';
const factoryUrl = 'https://factory-url';
const resourceDevworkspaceName = 'new-project';
const resources = [
  {
    metadata: {
      name: resourceDevworkspaceName,
    },
  } as devfileApi.DevWorkspace,
  {},
] as DevWorkspaceResources;

describe('Creating steps, applying resources', () => {
  let searchParams: URLSearchParams;
  let factoryId: string;

  beforeEach(() => {
    (prepareResources as jest.Mock).mockReturnValue(resources);

    history = createMemoryHistory({
      initialEntries: [ROUTE.FACTORY_LOADER],
    });

    factoryId = `${DEV_WORKSPACE_ATTR}=${resourcesUrl}&${FACTORY_URL_ATTR}=${factoryUrl}`;

    searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: factoryUrl,
      [DEV_WORKSPACE_ATTR]: resourcesUrl,
    });

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('resources are not fetched', async () => {
    const store = getStoreBuilder().build();
    renderComponent(store, searchParams);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    const expectAlertItem = expect.objectContaining({
      title: 'Failed to create the workspace',
      actionCallbacks: [
        expect.objectContaining({
          title: 'Click to try again',
          callback: expect.any(Function),
        }),
      ],
    });
    await waitFor(() => expect(mockOnError).toHaveBeenCalledWith(expectAlertItem));

    // stay on the factory loader page
    expect(history.location.pathname).toContain('/load-factory');

    expect(mockOnNextStep).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();
  });

  describe('handle name conflicts', () => {
    test('name conflict', async () => {
      const store = getStoreBuilder()
        .withDevWorkspaces({
          workspaces: [new DevWorkspaceBuilder().withName(resourceDevworkspaceName).build()],
        })
        .withDevfileRegistries({
          devWorkspaceResources: {
            [resourcesUrl]: {
              resources,
            },
          },
        })
        .build();

      renderComponent(store, searchParams);
      await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

      await waitFor(() =>
        expect(prepareResources).toHaveBeenCalledWith(resources, factoryId, undefined, true),
      );
    });

    test('policy "perclick"', async () => {
      const store = getStoreBuilder()
        .withDevWorkspaces({
          workspaces: [new DevWorkspaceBuilder().withName('unique-name').build()],
        })
        .withDevfileRegistries({
          devWorkspaceResources: {
            [resourcesUrl]: {
              resources,
            },
          },
        })
        .build();

      factoryId = `${DEV_WORKSPACE_ATTR}=${resourcesUrl}&${POLICIES_CREATE_ATTR}=perclick&${FACTORY_URL_ATTR}=${factoryUrl}`;
      searchParams.append(POLICIES_CREATE_ATTR, 'perclick');

      renderComponent(store, searchParams);
      await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

      await waitFor(() =>
        expect(prepareResources).toHaveBeenCalledWith(resources, factoryId, undefined, true),
      );
    });

    test('unique name', async () => {
      const store = getStoreBuilder()
        .withDevWorkspaces({
          workspaces: [new DevWorkspaceBuilder().withName('unique-name').build()],
        })
        .withDevfileRegistries({
          devWorkspaceResources: {
            [resourcesUrl]: {
              resources,
            },
          },
        })
        .build();

      renderComponent(store, searchParams);
      await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

      await waitFor(() =>
        expect(prepareResources).toHaveBeenCalledWith(resources, factoryId, undefined, false),
      );
    });
  });

  describe('step timeout reached', () => {
    let emptyStore: Store;

    beforeEach(() => {
      emptyStore = new FakeStoreBuilder().build();
    });

    test('notification alert', async () => {
      renderComponent(emptyStore, searchParams);
      jest.runAllTimers();

      // trigger timeout
      const timeoutButton = screen.getByRole('button', {
        name: 'onTimeout',
      });
      userEvent.click(timeoutButton);

      const expectAlertItem = expect.objectContaining({
        title: 'Failed to create the workspace',
        children: `Workspace hasn't been created in the last ${TIMEOUT_TO_CREATE_SEC} seconds.`,
        actionCallbacks: [
          expect.objectContaining({
            title: 'Click to try again',
            callback: expect.any(Function),
          }),
        ],
      });
      await waitFor(() => expect(mockOnError).toHaveBeenCalledWith(expectAlertItem));

      expect(mockOnNextStep).not.toHaveBeenCalled();
      expect(mockOnRestart).not.toHaveBeenCalled();
    });

    test('action callback to try again', async () => {
      // this deferred object will help run the callback at the right time
      const deferred = getDefer();

      const actionTitle = 'Click to try again';
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

      renderComponent(emptyStore, searchParams);
      await jest.runAllTimersAsync();

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
      await jest.runOnlyPendingTimersAsync();

      await waitFor(() => expect(mockOnRestart).toHaveBeenCalled());
      expect(mockOnNextStep).not.toHaveBeenCalled();
      expect(mockOnError).toHaveBeenCalled();
    });
  });

  test('the workspace created successfully', async () => {
    const store = getStoreBuilder()
      .withDevfileRegistries({
        devWorkspaceResources: {
          [resourcesUrl]: {
            resources,
          },
        },
      })
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder().withName('other-workspace').withNamespace('user-che').build(),
        ],
      })
      .build();

    const { reRenderComponent } = renderComponent(store, searchParams);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);
    await jest.runOnlyPendingTimersAsync();

    await waitFor(() => expect(mockCreateWorkspaceFromResources).toHaveBeenCalled());

    // stay on the factory loader page
    expect(history.location.pathname).toContain('/load-factory');
    expect(mockOnNextStep).not.toHaveBeenCalled();
    expect(mockOnError).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();

    // wait a bit less than necessary to end the workspace creating timeout
    const time = (TIMEOUT_TO_CREATE_SEC - 1) * 1000;
    await jest.advanceTimersByTimeAsync(time);

    // build next store
    const nextStore = getStoreBuilder()
      .withDevfileRegistries({
        devWorkspaceResources: {
          [resourcesUrl]: {
            resources,
          },
        },
      })
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(resourceDevworkspaceName)
            .withNamespace('user-che')
            .build(),
        ],
      })
      .build();
    reRenderComponent(nextStore, searchParams);

    await jest.runAllTimersAsync();

    await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
    expect(mockOnError).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();

    expect(history.location.pathname).toEqual(`/ide/user-che/${resourceDevworkspaceName}`);
  });

  test('handle warning when creating a workspace', async () => {
    const devWorkspace = new DevWorkspaceBuilder()
      .withUID('workspace-uid')
      .withName(resourceDevworkspaceName)
      .withNamespace('user-che')
      .build();
    const warningMessage = 'This is a warning';

    const store = getStoreBuilder()
      .withDevWorkspaces({
        workspaces: [devWorkspace],
        warnings: { 'workspace-uid': warningMessage },
      })
      .withDevfileRegistries({
        devWorkspaceResources: {
          [resourcesUrl]: {
            resources,
          },
        },
      })
      .build();

    renderComponent(store, searchParams);
    await jest.runAllTimersAsync();

    await waitFor(() => expect(screen.getByText(`Warning: ${warningMessage}`)).toBeTruthy());

    await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
    expect(mockOnError).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();
  });
});

function getStoreBuilder(): FakeStoreBuilder {
  return new FakeStoreBuilder().withInfrastructureNamespace([
    {
      attributes: { phase: 'Active' },
      name: 'user-che',
    },
  ]);
}

function getComponent(store: Store, searchParams: URLSearchParams): React.ReactElement {
  const component = (
    <CreatingStepApplyResources
      distance={0}
      hasChildren={false}
      searchParams={searchParams}
      history={history}
      onNextStep={mockOnNextStep}
      onRestart={mockOnRestart}
      onError={mockOnError}
      onHideError={mockOnHideError}
    />
  );
  return <Provider store={store}>{component}</Provider>;
}
