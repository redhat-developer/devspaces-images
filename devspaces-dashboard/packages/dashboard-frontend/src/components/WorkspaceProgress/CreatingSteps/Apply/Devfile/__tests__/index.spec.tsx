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
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory, MemoryHistory } from 'history';
import { dump } from 'js-yaml';
import React from 'react';
import { Provider } from 'react-redux';
import { Action, Store } from 'redux';
import CreatingStepApplyDevfile, { State } from '..';
import ExpandableWarning from '../../../../../ExpandableWarning';
import { ROUTE } from '../../../../../../Routes/routes';
import devfileApi from '../../../../../../services/devfileApi';
import {
  buildFactoryParams,
  FACTORY_URL_ATTR,
  POLICIES_CREATE_ATTR,
} from '../../../../../../services/helpers/factoryFlow/buildFactoryParams';
import { getDefer } from '../../../../../../services/helpers/deferred';
import { AlertItem } from '../../../../../../services/helpers/types';
import getComponentRenderer from '../../../../../../services/__mocks__/getComponentRenderer';
import { AppThunk } from '../../../../../../store';
import { ActionCreators } from '../../../../../../store/Workspaces';
import { DevWorkspaceBuilder } from '../../../../../../store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '../../../../../../store/__mocks__/storeBuilder';
import { MIN_STEP_DURATION_MS } from '../../../../const';
import { prepareDevfile } from '../prepareDevfile';

jest.mock('../../../../TimeLimit');
jest.mock('../prepareDevfile.ts');

let mockCreateWorkspaceFromDevfile;
jest.mock('../../../../../../store/Workspaces/index', () => {
  return {
    actionCreators: {
      createWorkspaceFromDevfile:
        (
          ...args: Parameters<ActionCreators['createWorkspaceFromDevfile']>
        ): AppThunk<Action, Promise<void>> =>
        async (): Promise<void> =>
          mockCreateWorkspaceFromDevfile(...args),
    } as ActionCreators,
  };
});

const { renderComponent } = getComponentRenderer(getComponent);
let history: MemoryHistory;

const mockOnNextStep = jest.fn();
const mockOnRestart = jest.fn();
const mockOnError = jest.fn();
const mockOnHideError = jest.fn();

const factoryUrl = 'https://factory-url';
const devfileName = 'new-project';
const devfile = {
  schemaVersion: '2.1.0',
  metadata: {
    name: devfileName,
  },
} as devfileApi.Devfile;

describe('Creating steps, applying a devfile', () => {
  let searchParams: URLSearchParams;
  let factoryId: string;

  beforeEach(() => {
    mockCreateWorkspaceFromDevfile = jest.fn().mockResolvedValue(undefined);

    (prepareDevfile as jest.Mock).mockReturnValue(devfile);

    history = createMemoryHistory({
      initialEntries: [ROUTE.FACTORY_LOADER],
    });

    factoryId = `${FACTORY_URL_ATTR}=${factoryUrl}`;

    searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: factoryUrl,
    });

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('factory url is not resolved', () => {
    test('alert notification', async () => {
      const store = getStoreBuilder().build();
      renderComponent(store, searchParams);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      const expectAlertItem = expect.objectContaining({
        title: 'Failed to create the workspace',
        children: 'Failed to resolve the devfile.',
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

      // stay on the factory loader page
      expect(history.location.pathname).toContain('/load-factory');
    });

    test('action callback to restart the step', async () => {
      // this deferred object will help run the callback at the right time
      const deferred = getDefer();

      // test the restart callback
      mockOnError.mockImplementationOnce((alertItem: AlertItem) => {
        const restartAction = alertItem.actionCallbacks?.find(action =>
          action.title.startsWith('Click to try again'),
        );
        expect(restartAction).toBeDefined();

        if (restartAction) {
          deferred.promise.then(restartAction.callback);
        } else {
          throw new Error('Action not found');
        }
      });

      const store = getStoreBuilder().build();
      renderComponent(store, searchParams);
      jest.runAllTimers();

      await waitFor(() => expect(mockOnError).toHaveBeenCalled());
      expect(mockOnNextStep).not.toHaveBeenCalled();
      expect(mockOnRestart).not.toHaveBeenCalled();

      /* test the action */

      // resolve deferred to trigger the callback
      deferred.resolve();

      await waitFor(() => expect(mockOnRestart).toHaveBeenCalled());
    });
  });

  describe('using the default devfile', () => {
    test('the user devfile has not been resolved', async () => {
      const registryUrl = 'https://registry-url';
      const sampleResourceUrl = 'https://resources-url';
      const registryMetadata = {
        displayName: 'Empty Workspace',
        description: 'Start an empty remote development environment',
        tags: ['Empty'],
        icon: '/images/empty.svg',
        links: {
          v2: sampleResourceUrl,
        },
      } as che.DevfileMetaData;
      const sampleContent = dump({
        schemaVersion: '2.1.0',
        metadata: {
          generateName: 'empty',
        },
        attributes: {
          defaultDevfile: true, // this is the default devfile
        },
      } as devfileApi.Devfile);
      const defaultComponents = [
        {
          name: 'universal-developer-image',
          container: {
            image: 'quay.io/devfile/universal-developer-image:ubi8-latest',
          },
        },
      ];

      const store = getStoreBuilder()
        .withFactoryResolver({ resolver: undefined, converted: undefined })
        .withDevfileRegistries({
          registries: {
            [registryUrl]: {
              metadata: [registryMetadata],
            },
          },
          devfiles: {
            [sampleResourceUrl]: {
              content: sampleContent,
            },
          },
        })
        .withDwServerConfig({
          defaults: {
            components: defaultComponents,
          },
        } as api.IServerConfig)
        .build();

      renderComponent(store, searchParams);
      jest.runAllTimers();

      await waitFor(() =>
        expect(prepareDevfile).toHaveBeenCalledWith(
          expect.objectContaining({
            attributes: {
              defaultDevfile: true,
            },
          }),
          factoryId,
          undefined,
          false,
        ),
      );
      await waitFor(() => expect(mockCreateWorkspaceFromDevfile).toHaveBeenCalled());
    });

    test('workspace creation failed', async () => {
      const registryUrl = 'https://registry-url';
      const sampleResourceUrl = 'https://resources-url';
      const registryMetadata = {
        displayName: 'Empty Workspace',
        description: 'Start an empty remote development environment',
        tags: ['Empty'],
        icon: '/images/empty.svg',
        links: {
          v2: sampleResourceUrl,
        },
      } as che.DevfileMetaData;
      const sampleContent = dump({
        schemaVersion: '2.1.0',
        metadata: {
          generateName: 'empty',
        },
        attributes: {
          defaultDevfile: true, // this is the default devfile
        },
      } as devfileApi.Devfile);
      const defaultComponents = [
        {
          name: 'universal-developer-image',
          container: {
            image: 'quay.io/devfile/universal-developer-image:ubi8-latest',
          },
        },
      ];

      const store = getStoreBuilder()
        .withFactoryResolver({
          resolver: {},
          converted: {
            devfileV2: devfile,
          },
        })
        .withDevfileRegistries({
          registries: {
            [registryUrl]: {
              metadata: [registryMetadata],
            },
          },
          devfiles: {
            [sampleResourceUrl]: {
              content: sampleContent,
            },
          },
        })
        .withDwServerConfig({
          defaults: {
            components: defaultComponents,
          },
        } as api.IServerConfig)
        .build();

      const localState: Partial<State> = {
        continueWithDefaultDevfile: true,
        factoryParams: buildFactoryParams(searchParams),
      };

      renderComponent(store, searchParams, localState);
      jest.runAllTimers();

      await waitFor(() =>
        expect(prepareDevfile).toHaveBeenCalledWith(
          expect.objectContaining({
            attributes: {
              defaultDevfile: true,
            },
          }),
          factoryId,
          undefined,
          false,
        ),
      );
      await waitFor(() => expect(mockCreateWorkspaceFromDevfile).toHaveBeenCalled());
    });
  });

  describe('handle name conflicts', () => {
    test('with name conflict', async () => {
      const store = getStoreBuilder()
        .withDevWorkspaces({
          workspaces: [new DevWorkspaceBuilder().withName(devfileName).build()],
        })
        .withFactoryResolver({
          resolver: {},
          converted: {
            devfileV2: devfile,
          },
        })
        .build();

      renderComponent(store, searchParams);
      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      await waitFor(() =>
        expect(prepareDevfile).toHaveBeenCalledWith(devfile, factoryId, undefined, true),
      );
    });

    test('with policy "perclick"', async () => {
      const store = getStoreBuilder()
        .withDevWorkspaces({
          workspaces: [new DevWorkspaceBuilder().withName('unique-name').build()],
        })
        .withFactoryResolver({
          resolver: {},
          converted: {
            devfileV2: devfile,
          },
        })
        .build();

      searchParams.append(POLICIES_CREATE_ATTR, 'perclick');
      factoryId = `${POLICIES_CREATE_ATTR}=perclick&` + factoryId;

      renderComponent(store, searchParams);
      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      await waitFor(() =>
        expect(prepareDevfile).toHaveBeenCalledWith(devfile, factoryId, undefined, true),
      );
    });

    test('with unique name', async () => {
      const store = getStoreBuilder()
        .withDevWorkspaces({
          workspaces: [new DevWorkspaceBuilder().withName('unique-name').build()],
        })
        .withFactoryResolver({
          resolver: {},
          converted: {
            devfileV2: devfile,
          },
        })
        .build();

      renderComponent(store, searchParams);
      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      await waitFor(() =>
        expect(prepareDevfile).toHaveBeenCalledWith(devfile, factoryId, undefined, false),
      );
    });
  });

  describe('workspace creation failed', () => {
    let store: Store;

    beforeEach(() => {
      const registryUrl = 'https://registry-url';
      const sampleResourceUrl = 'https://resources-url';
      const registryMetadata = {
        displayName: 'Empty Workspace',
        description: 'Start an empty remote development environment',
        tags: ['Empty'],
        icon: '/images/empty.svg',
        links: {
          v2: sampleResourceUrl,
        },
      } as che.DevfileMetaData;
      const sampleContent = dump({
        schemaVersion: '2.1.0',
        metadata: {
          generateName: 'empty',
        },
      } as devfileApi.Devfile);

      mockCreateWorkspaceFromDevfile = jest.fn().mockRejectedValueOnce(new Error());

      store = getStoreBuilder()
        .withDevWorkspaces({
          workspaces: [new DevWorkspaceBuilder().withName('unique-name').build()],
        })
        .withFactoryResolver({
          resolver: {},
          converted: {
            devfileV2: devfile,
          },
        })
        .withDevfileRegistries({
          registries: {
            [registryUrl]: {
              metadata: [registryMetadata],
            },
          },
          devfiles: {
            [sampleResourceUrl]: {
              content: sampleContent,
            },
          },
        })
        .build();
    });

    test('notification alert', async () => {
      renderComponent(store, searchParams);
      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      const expectAlertItem = expect.objectContaining({
        title: 'Warning',
        children: (
          <ExpandableWarning
            errorMessage=""
            textAfter="If you continue it will be ignored and a regular workspace will be created.
            You will have a chance to fix the Devfile from the IDE once it is started."
            textBefore="The new Workspace couldn't be created from the Devfile in the git repository:"
          />
        ),
        actionCallbacks: [
          expect.objectContaining({
            title: 'Continue with the default devfile',
            callback: expect.any(Function),
          }),
          expect.objectContaining({
            title: 'Reload',
            callback: expect.any(Function),
          }),
        ],
      });
      await waitFor(() => expect(mockOnError).toHaveBeenCalledWith(expectAlertItem));

      expect(mockCreateWorkspaceFromDevfile).toHaveBeenCalled();
      expect(mockOnNextStep).not.toHaveBeenCalled();
      expect(mockOnRestart).not.toHaveBeenCalled();
    });

    test('action callback to reload restart the step', async () => {
      // this deferred object will help run the callback at the right time
      const deferred = getDefer();

      const reloadActionTitle = 'Reload';
      mockOnError.mockImplementationOnce(async (alertItem: AlertItem) => {
        const reloadAction = alertItem.actionCallbacks?.find(action =>
          action.title.startsWith(reloadActionTitle),
        );
        expect(reloadAction).toBeDefined();

        if (reloadAction) {
          deferred.promise.then(reloadAction.callback);
        } else {
          throw new Error('Action not found');
        }
      });

      renderComponent(store, searchParams);
      jest.runAllTimers();

      await waitFor(() => expect(mockOnError).toHaveBeenCalled());
      expect(mockOnNextStep).not.toHaveBeenCalled();
      expect(mockOnRestart).not.toHaveBeenCalled();

      mockOnError.mockClear();

      /* test the action */

      // resolve deferred to trigger the callback
      deferred.resolve();

      await waitFor(() => expect(mockOnRestart).toHaveBeenCalled());
      expect(mockOnNextStep).not.toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();

      expect(mockCreateWorkspaceFromDevfile).toHaveBeenCalledTimes(1);

      // the workspace creation was called twice
      await waitFor(() => expect(mockCreateWorkspaceFromDevfile).toHaveBeenCalledTimes(2));
    });

    test('action callback to continue with the default devfile', async () => {
      // this deferred object will help run the callback at the right time
      const deferred = getDefer();

      const continueActionTitle = 'Continue with the default devfile';
      mockOnError.mockImplementationOnce(async (alertItem: AlertItem) => {
        const continueAction = alertItem.actionCallbacks?.find(action =>
          action.title.startsWith(continueActionTitle),
        );
        expect(continueAction).toBeDefined();

        if (continueAction) {
          deferred.promise.then(continueAction.callback);
        } else {
          throw new Error('Action not found');
        }
      });

      renderComponent(store, searchParams);
      jest.runAllTimers();

      await waitFor(() => expect(mockOnError).toHaveBeenCalled());
      expect(mockOnNextStep).not.toHaveBeenCalled();
      expect(mockOnRestart).not.toHaveBeenCalled();

      expect(mockCreateWorkspaceFromDevfile).toHaveBeenCalledTimes(1);

      /* test the action */

      // resolve deferred to trigger the callback
      deferred.resolve();

      await waitFor(() => expect(mockCreateWorkspaceFromDevfile).toHaveBeenCalledTimes(2));
    });
  });

  test('creation timeout expired, alert notification', async () => {
    const store = getStoreBuilder()
      .withFactoryResolver({
        resolver: {},
        converted: {
          devfileV2: devfile,
        },
      })
      .build();

    renderComponent(store, searchParams);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    await waitFor(() => expect(mockCreateWorkspaceFromDevfile).toHaveBeenCalled());
    expect(mockOnError).not.toHaveBeenCalled();
    expect(mockOnNextStep).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();

    // stay on the factory loader page
    expect(history.location.pathname).toContain('/load-factory');

    // imitate the timeout has been expired
    const timeoutButton = screen.getByRole('button', { name: 'onTimeout' });
    userEvent.click(timeoutButton);

    const expectAlertItem = expect.objectContaining({
      title: 'Failed to create the workspace',
      children: `Workspace hasn't been created in the last 20 seconds.`,
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

  test('the new workspace created successfully', async () => {
    const store = getStoreBuilder()
      .withFactoryResolver({
        resolver: {},
        converted: {
          devfileV2: devfile,
        },
      })
      .build();

    const { reRenderComponent } = renderComponent(store, searchParams);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    await waitFor(() => expect(mockCreateWorkspaceFromDevfile).toHaveBeenCalled());
    expect(mockOnError).not.toHaveBeenCalled();

    // stay on the factory loader page
    expect(history.location.pathname).toContain('/load-factory');
    expect(mockOnNextStep).not.toHaveBeenCalled();

    // build next store
    const nextStore = getStoreBuilder()
      .withFactoryResolver({
        resolver: {},
        converted: {
          devfileV2: devfile,
        },
      })
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder().withName(devfileName).withNamespace('user-che').build(),
        ],
      })
      .build();
    reRenderComponent(nextStore, searchParams);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
    expect(history.location.pathname).toEqual(`/ide/user-che/${devfileName}`);

    await waitFor(() => expect(screen.queryByTestId('loader-alert')).toBeFalsy());
  });

  test('handle warning when creating a workspace', async () => {
    const devWorkspace = new DevWorkspaceBuilder()
      .withUID('workspace-uid')
      .withName(devfileName)
      .withNamespace('user-che')
      .build();
    const warningMessage = 'This is a warning';

    const store = getStoreBuilder()
      .withFactoryResolver({
        resolver: {},
        converted: {
          devfileV2: devfile,
        },
      })
      .withDevWorkspaces({
        workspaces: [devWorkspace],
        warnings: { 'workspace-uid': warningMessage },
      })
      .build();

    renderComponent(store, searchParams);
    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

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

function getComponent(
  store: Store,
  searchParams: URLSearchParams,
  localState?: Partial<State>,
): React.ReactElement {
  const component = (
    <CreatingStepApplyDevfile
      distance={0}
      searchParams={searchParams}
      history={history}
      onNextStep={mockOnNextStep}
      onRestart={mockOnRestart}
      onError={mockOnError}
      onHideError={mockOnHideError}
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
