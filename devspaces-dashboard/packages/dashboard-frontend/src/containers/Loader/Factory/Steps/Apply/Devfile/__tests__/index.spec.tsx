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
import { createMemoryHistory, MemoryHistory } from 'history';
import { dump } from 'js-yaml';
import React from 'react';
import { Provider } from 'react-redux';
import { Action, Store } from 'redux';
import StepApplyDevfile, { State } from '..';
import { List, LoaderStep, LoadingStep } from '../../../../../../../components/Loader/Step';
import {
  buildLoaderSteps,
  getFactoryLoadingSteps,
} from '../../../../../../../components/Loader/Step/buildSteps';
import { ROUTE } from '../../../../../../../Routes/routes';
import devfileApi from '../../../../../../../services/devfileApi';
import getComponentRenderer from '../../../../../../../services/__mocks__/getComponentRenderer';
import { AppThunk } from '../../../../../../../store';
import { ActionCreators } from '../../../../../../../store/Workspaces';
import { DevWorkspaceBuilder } from '../../../../../../../store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '../../../../../../../store/__mocks__/storeBuilder';
import { buildFactoryParams } from '../../../../../buildFactoryParams';
import {
  FACTORY_URL_ATTR,
  MIN_STEP_DURATION_MS,
  POLICIES_CREATE_ATTR,
  REMOTES_ATTR,
  TIMEOUT_TO_CREATE_SEC,
} from '../../../../../const';
import { prepareDevfile } from '../prepareDevfile';

jest.mock('../prepareDevfile.ts');
jest.mock('../../../../../../../pages/Loader');

const mockCreateWorkspaceFromDevfile = jest.fn().mockResolvedValue(undefined);
jest.mock('../../../../../../../store/Workspaces/index', () => {
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
const mockOnTabChange = jest.fn();

const stepId = LoadingStep.CREATE_WORKSPACE__APPLY_DEVFILE.toString();
const currentStepIndex = 5;
const loadingSteps = getFactoryLoadingSteps('devfile');

const factoryUrl = 'https://factory-url';
const devfileName = 'new-project';
const devfile = {
  schemaVersion: '2.1.0',
  metadata: {
    name: devfileName,
  },
} as devfileApi.Devfile;

describe('Factory Loader container, step CREATE_WORKSPACE__APPLYING_DEVFILE', () => {
  let searchParams: URLSearchParams;
  let loaderSteps: List<LoaderStep>;
  let factoryId: string;

  beforeEach(() => {
    (prepareDevfile as jest.Mock).mockReturnValue(devfile);

    history = createMemoryHistory({
      initialEntries: [ROUTE.FACTORY_LOADER],
    });

    factoryId = `${FACTORY_URL_ATTR}=${factoryUrl}`;

    searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: factoryUrl,
    });
    loaderSteps = buildLoaderSteps(loadingSteps);

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  test('restart flow', async () => {
    const localState: Partial<State> = {
      lastError: new Error('Unexpected error'),
      factoryParams: buildFactoryParams(searchParams),
    };
    const store = getStoreBuilder()
      .withFactoryResolver({
        resolver: {},
        converted: {
          devfileV2: devfile,
        },
      })
      .build();
    renderComponent(store, loaderSteps, searchParams, currentStepIndex, localState);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const restartButton = await screen.findByRole('button', {
      name: 'Click to try again',
    });
    expect(restartButton).toBeDefined();
    userEvent.click(restartButton);

    expect(mockOnRestart).toHaveBeenCalled();
  });

  test('factory url is not resolved', async () => {
    const store = getStoreBuilder().build();
    renderComponent(store, loaderSteps, searchParams, currentStepIndex);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('true');

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to create the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual('Failed to resolve the devfile.');

    // stay on the factory loader page
    expect(history.location.pathname).toContain('/load-factory');
    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  describe('configure remotes', () => {
    let dashboardDevfile: devfileApi.Devfile;

    beforeEach(() => {
      dashboardDevfile = {
        schemaVersion: '2.1.0',
        metadata: {
          name: devfileName,
          namespace: 'user-che',
        },
        projects: [
          {
            name: 'dashboard',
            git: {
              remotes: {
                origin: 'https://github.com/user/che-dashboard.git',
              },
            },
          },
        ],
      };
    });

    test('remotes configured with urls', async () => {
      const store = getStoreBuilder()
        .withFactoryResolver({
          resolver: {},
          converted: {
            devfileV2: dashboardDevfile,
          },
        })
        .build();

      const remotesAttr = '{http://git-test-1.git,http://git-test-2.git,http://git-test-3.git}';
      searchParams.append(REMOTES_ATTR, remotesAttr);

      renderComponent(store, loaderSteps, searchParams);
      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      factoryId = `${REMOTES_ATTR}=${remotesAttr}&` + factoryId;

      await waitFor(() =>
        expect(prepareDevfile).toHaveBeenCalledWith(dashboardDevfile, factoryId, undefined, false),
      );

      expect(dashboardDevfile.projects).not.toBe(undefined);
      expect(dashboardDevfile.projects?.length).toBe(1);
      expect(dashboardDevfile.projects?.[0]).toMatchObject({
        git: {
          checkoutFrom: {
            remote: 'origin',
          },
          remotes: {
            origin: 'http://git-test-1.git',
            upstream: 'http://git-test-2.git',
            fork1: 'http://git-test-3.git',
          },
        },
      });
    });

    test('remotes configured with urls and names', async () => {
      const store = getStoreBuilder()
        .withFactoryResolver({
          resolver: {},
          converted: {
            devfileV2: dashboardDevfile,
          },
        })
        .build();

      const remotesAttr =
        '{{test1,http://git-test-1.git},{test2,http://git-test-2.git},{test3,http://git-test-3.git}}';
      searchParams.append(REMOTES_ATTR, remotesAttr);

      renderComponent(store, loaderSteps, searchParams);
      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      factoryId = `${REMOTES_ATTR}=${remotesAttr}&` + factoryId;

      await waitFor(() =>
        expect(prepareDevfile).toHaveBeenCalledWith(dashboardDevfile, factoryId, undefined, false),
      );

      expect(dashboardDevfile.projects).not.toBe(undefined);
      expect(dashboardDevfile.projects?.length).toBe(1);
      expect(dashboardDevfile.projects?.[0]).toMatchObject({
        git: {
          checkoutFrom: {
            remote: 'origin',
          },
          remotes: {
            origin: 'https://github.com/user/che-dashboard.git',
            test1: 'http://git-test-1.git',
            test2: 'http://git-test-2.git',
            test3: 'http://git-test-3.git',
          },
        },
      });
    });

    test('keep origin remote if origin remote not provided as a parameter', async () => {
      const store = getStoreBuilder()
        .withFactoryResolver({
          resolver: {},
          converted: {
            devfileV2: dashboardDevfile,
          },
        })
        .build();

      // origin remote not provided
      const remotesAttr =
        '{{upstream,https://github.com/eclipse-che/che-dashboard.git},{fork,https://github.com/fork/che-dashboard.git}}';
      searchParams.append(REMOTES_ATTR, remotesAttr);

      renderComponent(store, loaderSteps, searchParams);
      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      factoryId = `${REMOTES_ATTR}=${remotesAttr}&` + factoryId;

      await waitFor(() =>
        expect(prepareDevfile).toHaveBeenCalledWith(dashboardDevfile, factoryId, undefined, false),
      );

      expect(dashboardDevfile.projects).not.toBe(undefined);
      expect(dashboardDevfile.projects?.length).toBe(1);
      expect(dashboardDevfile.projects?.[0]).toMatchObject({
        git: {
          checkoutFrom: {
            remote: 'origin',
          },
          remotes: {
            origin: 'https://github.com/user/che-dashboard.git',
            upstream: 'https://github.com/eclipse-che/che-dashboard.git',
            fork: 'https://github.com/fork/che-dashboard.git',
          },
        },
      });
    });

    test('keep origin remote and branch if origin remote not provided as a parameter', async () => {
      dashboardDevfile.projects = [
        {
          name: 'dashboard',
          git: {
            checkoutFrom: {
              revision: 'branch',
            },
            remotes: {
              origin: 'https://github.com/user/che-dashboard.git',
            },
          },
        },
      ];
      const store = getStoreBuilder()
        .withFactoryResolver({
          resolver: {},
          converted: {
            devfileV2: dashboardDevfile,
          },
        })
        .build();

      // origin remote not provided
      const remotesAttr =
        '{{upstream,https://github.com/eclipse-che/che-dashboard.git},{fork,https://github.com/fork/che-dashboard.git}}';
      searchParams.append(REMOTES_ATTR, remotesAttr);

      renderComponent(store, loaderSteps, searchParams);
      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      factoryId = `${REMOTES_ATTR}=${remotesAttr}&` + factoryId;

      await waitFor(() =>
        expect(prepareDevfile).toHaveBeenCalledWith(dashboardDevfile, factoryId, undefined, false),
      );

      expect(dashboardDevfile.projects).not.toBe(undefined);
      expect(dashboardDevfile.projects?.length).toBe(1);
      expect(dashboardDevfile.projects?.[0]).toMatchObject({
        git: {
          checkoutFrom: {
            remote: 'origin',
            revision: 'branch',
          },
          remotes: {
            origin: 'https://github.com/user/che-dashboard.git',
            upstream: 'https://github.com/eclipse-che/che-dashboard.git',
            fork: 'https://github.com/fork/che-dashboard.git',
          },
        },
      });
    });

    test('use new origin remote if provided as a parameter', async () => {
      const store = getStoreBuilder()
        .withFactoryResolver({
          resolver: {},
          converted: {
            devfileV2: dashboardDevfile,
          },
        })
        .build();

      // new origin branch provided
      const remotesAttr =
        '{{origin,https://github.com/other-user/che-dashboard.git},{upstream,https://github.com/eclipse-che/che-dashboard.git},{fork,https://github.com/fork/che-dashboard.git}}';
      searchParams.append(REMOTES_ATTR, remotesAttr);

      renderComponent(store, loaderSteps, searchParams);
      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      factoryId = `${REMOTES_ATTR}=${remotesAttr}&` + factoryId;

      await waitFor(() =>
        expect(prepareDevfile).toHaveBeenCalledWith(dashboardDevfile, factoryId, undefined, false),
      );

      expect(dashboardDevfile.projects).not.toBe(undefined);
      expect(dashboardDevfile.projects?.length).toBe(1);
      expect(dashboardDevfile.projects?.[0]).toMatchObject({
        git: {
          checkoutFrom: {
            remote: 'origin',
          },
          remotes: {
            origin: 'https://github.com/other-user/che-dashboard.git',
            upstream: 'https://github.com/eclipse-che/che-dashboard.git',
            fork: 'https://github.com/fork/che-dashboard.git',
          },
        },
      });
    });

    test('use default devfile when there is no project url, but remotes exist', async () => {
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

      const remotesAttr = '{https://github.com/eclipse-che/che-dashboard.git}';
      searchParams.append(REMOTES_ATTR, remotesAttr);
      searchParams.delete(FACTORY_URL_ATTR);

      renderComponent(store, loaderSteps, searchParams);
      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      const expectedDevfile = {
        schemaVersion: '2.1.0',
        metadata: {
          generateName: 'che-dashboard',
          name: 'che-dashboard',
        },
        components: [
          {
            container: {
              image: 'quay.io/devfile/universal-developer-image:ubi8-latest',
            },
            name: 'universal-developer-image',
          },
        ],
        projects: [
          {
            git: {
              checkoutFrom: { remote: 'origin' },
              remotes: {
                origin: 'https://github.com/eclipse-che/che-dashboard.git',
              },
            },
            name: 'che-dashboard',
          },
        ],
      };

      await waitFor(() =>
        expect(prepareDevfile).toHaveBeenCalledWith(
          expectedDevfile,
          `${REMOTES_ATTR}=${remotesAttr}`,
          undefined,
          false,
        ),
      );
    });
  });

  describe('handle name conflicts', () => {
    test('name conflict', async () => {
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

      renderComponent(store, loaderSteps, searchParams);
      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      await waitFor(() =>
        expect(prepareDevfile).toHaveBeenCalledWith(devfile, factoryId, undefined, true),
      );
    });

    test('policy "perclick"', async () => {
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

      renderComponent(store, loaderSteps, searchParams);
      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      await waitFor(() =>
        expect(prepareDevfile).toHaveBeenCalledWith(devfile, factoryId, undefined, true),
      );
    });

    test('unique name', async () => {
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

      renderComponent(store, loaderSteps, searchParams);
      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      await waitFor(() =>
        expect(prepareDevfile).toHaveBeenCalledWith(devfile, factoryId, undefined, false),
      );
    });
  });

  test('the workspace took more than TIMEOUT_TO_CREATE_SEC to create', async () => {
    const store = getStoreBuilder()
      .withFactoryResolver({
        resolver: {},
        converted: {
          devfileV2: devfile,
        },
      })
      .build();

    renderComponent(store, loaderSteps, searchParams, currentStepIndex);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    await waitFor(() => expect(mockCreateWorkspaceFromDevfile).toHaveBeenCalled());

    // stay on the factory loader page
    expect(history.location.pathname).toContain('/load-factory');
    expect(mockOnNextStep).not.toHaveBeenCalled();

    // wait a bit more than necessary to end the workspace creating timeout
    const time = (TIMEOUT_TO_CREATE_SEC + 1) * 1000;
    jest.advanceTimersByTime(time);

    await waitFor(() => expect(hasError.textContent).toEqual('true'));

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to create the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual(
      `Workspace hasn't been created in the last ${TIMEOUT_TO_CREATE_SEC} seconds.`,
    );

    // stay on the factory loader page
    expect(history.location.pathname).toContain('/load-factory');
    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('the workspace created successfully', async () => {
    const store = getStoreBuilder()
      .withFactoryResolver({
        resolver: {},
        converted: {
          devfileV2: devfile,
        },
      })
      .build();

    const { reRenderComponent } = renderComponent(
      store,
      loaderSteps,
      searchParams,
      currentStepIndex,
    );

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    await waitFor(() => expect(mockCreateWorkspaceFromDevfile).toHaveBeenCalled());

    // stay on the factory loader page
    expect(history.location.pathname).toContain('/load-factory');
    expect(mockOnNextStep).not.toHaveBeenCalled();

    // wait a bit less than necessary to end the workspace creating timeout
    const time = (TIMEOUT_TO_CREATE_SEC - 1) * 1000;
    jest.advanceTimersByTime(time);

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
    reRenderComponent(nextStore, loaderSteps, searchParams, currentStepIndex);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
    expect(history.location.pathname).toEqual(`/ide/user-che/${devfileName}`);

    expect(hasError.textContent).toEqual('false');
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

    renderComponent(store, loaderSteps, searchParams, currentStepIndex);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    await waitFor(() => expect(screen.getByText(`Warning: ${warningMessage}`)).toBeTruthy());

    await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());

    const currentStep = screen.getByTestId(stepId);
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');
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
  loaderSteps: List<LoaderStep>,
  searchParams: URLSearchParams,
  stepIndex = currentStepIndex,
  localState?: Partial<State>,
): React.ReactElement {
  const component = (
    <StepApplyDevfile
      searchParams={searchParams}
      currentStepIndex={stepIndex}
      history={history}
      loaderSteps={loaderSteps}
      tabParam={undefined}
      onNextStep={mockOnNextStep}
      onRestart={mockOnRestart}
      onTabChange={mockOnTabChange}
    />
  );
  if (localStorage) {
    return (
      <Provider store={store}>
        <StateMock state={localState}>{component}</StateMock>
      </Provider>
    );
  } else {
    return <Provider store={store}>{component}</Provider>;
  }
}
