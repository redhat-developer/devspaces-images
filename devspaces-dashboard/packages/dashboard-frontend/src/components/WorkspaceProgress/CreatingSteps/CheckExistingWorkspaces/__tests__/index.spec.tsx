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

import { waitFor } from '@testing-library/react';
import { createMemoryHistory, MemoryHistory } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { MIN_STEP_DURATION_MS } from '@/components/WorkspaceProgress/const';
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
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { DevWorkspaceResources } from '@/store/DevfileRegistries';

import CreatingStepCheckExistingWorkspaces from '..';

const { renderComponent } = getComponentRenderer(getComponent);
let history: MemoryHistory;

const mockOnNextStep = jest.fn();
const mockOnRestart = jest.fn();
const mockOnError = jest.fn();
const mockOnHideError = jest.fn();

const resourcesUrl = 'https://resources-url';
const factoryUrl = 'https://factory-url';

describe('Creating steps, checking existing workspaces', () => {
  beforeEach(() => {
    history = createMemoryHistory({
      initialEntries: [ROUTE.FACTORY_LOADER],
    });

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('creating workspace from resources', () => {
    let searchParams: URLSearchParams;

    beforeEach(() => {
      searchParams = new URLSearchParams({
        [FACTORY_URL_ATTR]: factoryUrl,
        [DEV_WORKSPACE_ATTR]: resourcesUrl,
      });
    });

    test('policy "perclick"', async () => {
      const searchParams = new URLSearchParams({
        [FACTORY_URL_ATTR]: factoryUrl,
        [POLICIES_CREATE_ATTR]: 'perclick',
        [DEV_WORKSPACE_ATTR]: resourcesUrl,
      });
      const store = new FakeStoreBuilder().build();
      renderComponent(store, searchParams);

      await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

      await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
      expect(mockOnError).not.toHaveBeenCalled();
      expect(mockOnRestart).not.toHaveBeenCalled();
    });

    describe('no workspace names conflicts', () => {
      let store: Store;
      const workspaceName = 'my-project';

      beforeEach(() => {
        const resources: DevWorkspaceResources = [
          {
            metadata: {
              name: workspaceName,
            },
          } as devfileApi.DevWorkspace,
          {} as devfileApi.DevWorkspaceTemplate,
        ];
        store = new FakeStoreBuilder()
          .withDevWorkspaces({
            workspaces: [
              new DevWorkspaceBuilder().withName('project-1').withNamespace('user-che').build(),
              new DevWorkspaceBuilder().withName('project-2').withNamespace('user-che').build(),
            ],
          })
          .withDevfileRegistries({
            devWorkspaceResources: {
              [resourcesUrl]: {
                resources,
              },
            },
          })
          .build();
      });

      it('should proceed to the next step', async () => {
        renderComponent(store, searchParams);

        await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

        jest.runOnlyPendingTimers();

        await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
        expect(mockOnError).not.toHaveBeenCalled();
        expect(mockOnRestart).not.toHaveBeenCalled();
      });
    });

    describe('workspace names conflict faced', () => {
      let store: Store;
      const workspaceName = 'my-project';

      beforeEach(() => {
        const resources: DevWorkspaceResources = [
          {
            metadata: {
              name: workspaceName,
            },
          } as devfileApi.DevWorkspace,
          {} as devfileApi.DevWorkspaceTemplate,
        ];
        store = new FakeStoreBuilder()
          .withDevWorkspaces({
            workspaces: [
              new DevWorkspaceBuilder().withName(workspaceName).withNamespace('user-che').build(),
            ],
          })
          .withDevfileRegistries({
            devWorkspaceResources: {
              [resourcesUrl]: {
                resources,
              },
            },
          })
          .build();
      });

      test('notification alert', async () => {
        renderComponent(store, searchParams);

        await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

        const expectAlertItem = expect.objectContaining({
          title: 'Existing workspace found',
          children: `A workspace with the same name (${workspaceName}) has been found. Should you want to open the existing workspace or proceed to create a new one, please choose the corresponding action.`,
          actionCallbacks: [
            expect.objectContaining({
              title: 'Open the existing workspace',
              callback: expect.any(Function),
            }),
            expect.objectContaining({
              title: 'Create a new workspace',
              callback: expect.any(Function),
            }),
          ],
        });
        await waitFor(() => expect(mockOnError).toHaveBeenCalledWith(expectAlertItem));

        expect(mockOnNextStep).not.toHaveBeenCalled();
        expect(mockOnRestart).not.toHaveBeenCalled();
      });

      test('action callback to open the existing workspace', async () => {
        // this deferred object will help run the callback at the right time
        const deferred = getDefer();

        const openExistingWorkspaceActionTitle = 'Open the existing workspace';
        mockOnError.mockImplementationOnce(async (alertItem: AlertItem) => {
          const openExistingWorkspaceAction = alertItem.actionCallbacks?.find(action =>
            action.title.startsWith(openExistingWorkspaceActionTitle),
          );
          expect(openExistingWorkspaceAction).toBeDefined();

          if (openExistingWorkspaceAction) {
            deferred.promise.then(openExistingWorkspaceAction.callback);
          } else {
            throw new Error('Action not found');
          }
        });

        renderComponent(store, searchParams);
        await jest.runAllTimersAsync();

        await waitFor(() => expect(mockOnError).toHaveBeenCalled());
        expect(mockOnNextStep).not.toHaveBeenCalled();
        expect(mockOnRestart).not.toHaveBeenCalled();

        mockOnError.mockClear();

        /* test the action */

        // resolve deferred to trigger the callback
        deferred.resolve();
        await jest.runOnlyPendingTimersAsync();

        await waitFor(() => expect(history.location.pathname).toEqual('/ide/user-che/my-project'));

        expect(mockOnNextStep).not.toHaveBeenCalled();
        expect(mockOnRestart).not.toHaveBeenCalled();
        expect(mockOnError).not.toHaveBeenCalled();
      });

      test('action callback to create a new workspace', async () => {
        // this deferred object will help run the callback at the right time
        const deferred = getDefer();

        const createWorkspaceActionTitle = 'Create a new workspace';
        mockOnError.mockImplementationOnce(async (alertItem: AlertItem) => {
          const createWorkspaceAction = alertItem.actionCallbacks?.find(action =>
            action.title.startsWith(createWorkspaceActionTitle),
          );
          expect(createWorkspaceAction).toBeDefined();

          if (createWorkspaceAction) {
            deferred.promise.then(createWorkspaceAction.callback);
          } else {
            throw new Error('Action not found');
          }
        });

        renderComponent(store, searchParams);
        await jest.runAllTimersAsync();

        await waitFor(() => expect(mockOnError).toHaveBeenCalled());
        expect(mockOnNextStep).not.toHaveBeenCalled();
        expect(mockOnRestart).not.toHaveBeenCalled();

        mockOnError.mockClear();

        /* test the action */

        // resolve deferred to trigger the callback
        deferred.resolve();
        await jest.runOnlyPendingTimersAsync();

        await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
        expect(mockOnRestart).not.toHaveBeenCalled();
        expect(mockOnError).not.toHaveBeenCalled();
      });
    });
  });

  describe('creating workspace from devfiles', () => {
    describe('workspace names conflict faced', () => {
      let store: Store;
      let searchParams: URLSearchParams;
      const workspaceName = 'my-project';

      beforeEach(() => {
        searchParams = new URLSearchParams({
          [FACTORY_URL_ATTR]: factoryUrl,
        });

        store = new FakeStoreBuilder()
          .withDevWorkspaces({
            workspaces: [
              new DevWorkspaceBuilder().withName(workspaceName).withNamespace('user-che').build(),
            ],
          })
          .withFactoryResolver({
            resolver: {
              location: factoryUrl,
            },
            converted: {
              devfileV2: {
                schemaVersion: '2.1.0',
                metadata: {
                  name: workspaceName,
                },
              } as devfileApi.Devfile,
            },
          })
          .build();
      });

      test('notification alert', async () => {
        renderComponent(store, searchParams);
        await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

        const expectAlertItem = expect.objectContaining({
          title: 'Existing workspace found',
          children: `A workspace with the same name (${workspaceName}) has been found. Should you want to open the existing workspace or proceed to create a new one, please choose the corresponding action.`,
          actionCallbacks: [
            expect.objectContaining({
              title: 'Open the existing workspace',
              callback: expect.any(Function),
            }),
            expect.objectContaining({
              title: 'Create a new workspace',
              callback: expect.any(Function),
            }),
          ],
        });
        await waitFor(() => expect(mockOnError).toHaveBeenCalledWith(expectAlertItem));
        expect(mockOnNextStep).not.toHaveBeenCalled();
        expect(mockOnRestart).not.toHaveBeenCalled();
      });
    });
  });
});

function getComponent(store: Store, searchParams: URLSearchParams): React.ReactElement {
  const component = (
    <CreatingStepCheckExistingWorkspaces
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
