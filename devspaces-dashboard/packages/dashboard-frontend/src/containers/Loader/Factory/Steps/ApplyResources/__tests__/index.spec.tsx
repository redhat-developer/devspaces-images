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
import { screen, waitFor, within } from '@testing-library/react';
import { dump } from 'js-yaml';
import { generatePath, MemoryRouter, Route } from 'react-router-dom';
import { Location } from 'history';
import { ROUTE } from '../../../../../../Routes/routes';
import { FakeStoreBuilder } from '../../../../../../store/__mocks__/storeBuilder';
import { DevWorkspaceBuilder } from '../../../../../../store/__mocks__/devWorkspaceBuilder';
import { ActionCreators } from '../../../../../../store/Workspaces/devWorkspaces';
import { AppThunk } from '../../../../../../store';
import { List, LoaderStep, LoadingStep } from '../../../../../../components/Loader/Step';
import {
  buildLoaderSteps,
  getFactoryLoadingSteps,
} from '../../../../../../components/Loader/Step/buildSteps';
import { DEVWORKSPACE_DEVFILE_SOURCE } from '../../../../../../services/workspace-client/devworkspace/devWorkspaceClient';
import devfileApi from '../../../../../../services/devfileApi';
import { prepareResources } from '../prepareResources';
import { DevWorkspaceResources } from '../../../../../../store/DevfileRegistries';
import StepApplyResources from '..';
import getComponentRenderer from '../../../../../../services/__mocks__/getComponentRenderer';
import {
  DEV_WORKSPACE_ATTR,
  FACTORY_URL_ATTR,
  MIN_STEP_DURATION_MS,
  TIMEOUT_TO_CREATE_SEC,
} from '../../../../const';
import userEvent from '@testing-library/user-event';

jest.mock('../prepareResources.ts');
jest.mock('../../../../../../pages/Loader/Factory');

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

const mockOnNextStep = jest.fn();
const mockOnRestart = jest.fn();
let testLocation: Location;

const stepId = LoadingStep.CREATE_WORKSPACE__APPLY_RESOURCES.toString();
const currentStepIndex = 3;
const loadingSteps = getFactoryLoadingSteps('devworkspace');

const resourcesUrl = 'https://resources-url';
const factoryUrl = 'https://factory-url';
const factoryId = `${DEV_WORKSPACE_ATTR}=${resourcesUrl}&${FACTORY_URL_ATTR}=${factoryUrl}`;

describe('Factory Loader container, step CREATE_WORKSPACE__APPLYING_RESOURCES', () => {
  let loaderSteps: List<LoaderStep>;
  let searchParams: URLSearchParams;

  beforeEach(() => {
    (prepareResources as jest.Mock).mockReturnValue([{}, {}]);

    searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: factoryUrl,
      [DEV_WORKSPACE_ATTR]: resourcesUrl,
    });

    loaderSteps = buildLoaderSteps(loadingSteps);

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  test('restart flow', async () => {
    const store = new FakeStoreBuilder().build();
    const path = generatePath(ROUTE.FACTORY_LOADER_URL, {
      url: factoryUrl,
    });
    renderComponent(store, path, loaderSteps, searchParams, currentStepIndex);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const restartButton = screen.getByRole('button', {
      name: 'Restart',
    });
    userEvent.click(restartButton);

    expect(mockOnRestart).toHaveBeenCalled();
  });

  test('workspace is already created', async () => {
    const factorySource = {
      factory: {
        params: factoryId,
      },
    };
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName('my-project')
            .withNamespace('user-che')
            .withMetadata({
              annotations: {
                [DEVWORKSPACE_DEVFILE_SOURCE]: dump(factorySource),
              },
            })
            .build(),
        ],
      })
      .build();

    const path = generatePath(ROUTE.FACTORY_LOADER_URL, {
      url: factoryUrl,
    });
    renderComponent(store, path, loaderSteps, searchParams);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
    expect(testLocation.pathname).toEqual('/ide/user-che/my-project');
  });

  test('resources are not fetched', async () => {
    const store = new FakeStoreBuilder().build();

    const path = generatePath(ROUTE.FACTORY_LOADER_URL, {
      url: factoryUrl,
    });
    renderComponent(store, path, loaderSteps, searchParams);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('true');

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to create the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual('Failed to fetch devworkspace resources.');

    // stay on the factory loader page
    expect(testLocation.pathname).toContain('/load-factory');
    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('the workspace took more than TIMEOUT_TO_CREATE_SEC to create', async () => {
    const resources: DevWorkspaceResources = [
      {
        metadata: {
          name: 'project',
        },
      } as devfileApi.DevWorkspace,
      {} as devfileApi.DevWorkspaceTemplate,
    ];
    const store = new FakeStoreBuilder()
      .withDevfileRegistries({
        devWorkspaceResources: {
          [resourcesUrl]: {
            resources,
          },
        },
      })
      .build();
    (prepareResources as jest.Mock).mockReturnValue(resources);

    const path = generatePath(ROUTE.FACTORY_LOADER_URL, {
      url: factoryUrl,
    });
    renderComponent(store, path, loaderSteps, searchParams);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    await waitFor(() => expect(mockCreateWorkspaceFromResources).toHaveBeenCalled());

    // stay on the factory loader page
    expect(testLocation.pathname).toContain('/load-factory');
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
    expect(testLocation.pathname).toContain('/load-factory');
    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('the workspace created successfully', async () => {
    const store = new FakeStoreBuilder()
      .withDevfileRegistries({
        devWorkspaceResources: {
          [resourcesUrl]: {
            resources: [{} as devfileApi.DevWorkspace, {} as devfileApi.DevWorkspaceTemplate],
          },
        },
      })
      .build();
    const factorySource = dump({
      factory: {
        params: factoryId,
      },
    });
    (prepareResources as jest.Mock).mockReturnValue([
      {
        apiVersion: 'workspace.devfile.io/v1alpha2',
        kind: 'DevWorkspace',
        metadata: {
          name: 'project',
          annotations: {
            [DEVWORKSPACE_DEVFILE_SOURCE]: factorySource,
          },
          labels: {},
          namespace: 'user-che',
          uid: '',
        },
        spec: {
          started: false,
          template: {},
        },
      } as devfileApi.DevWorkspace,
      {},
    ]);

    const path = generatePath(ROUTE.FACTORY_LOADER_URL, {
      url: factoryUrl,
    });
    const { reRenderComponent } = renderComponent(store, path, loaderSteps, searchParams);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    await waitFor(() => expect(mockCreateWorkspaceFromResources).toHaveBeenCalled());

    // stay on the factory loader page
    expect(testLocation.pathname).toContain('/load-factory');
    expect(mockOnNextStep).not.toHaveBeenCalled();

    // wait a bit less than necessary to end the workspace creating timeout
    const time = (TIMEOUT_TO_CREATE_SEC - 1) * 1000;
    jest.advanceTimersByTime(time);

    // build next store
    const nextStore = new FakeStoreBuilder()
      .withDevfileRegistries({
        devWorkspaceResources: {
          [resourcesUrl]: {
            resources: [{} as devfileApi.DevWorkspace, {} as devfileApi.DevWorkspaceTemplate],
          },
        },
      })
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName('my-project')
            .withNamespace('user-che')
            .withMetadata({
              annotations: {
                [DEVWORKSPACE_DEVFILE_SOURCE]: factorySource,
              },
            })
            .build(),
        ],
      })
      .build();
    reRenderComponent(nextStore, path, loaderSteps, searchParams);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
    expect(testLocation.pathname).toEqual('/ide/user-che/my-project');

    expect(hasError.textContent).toEqual('false');
  });
});

function getComponent(
  store: Store,
  path: string,
  loaderSteps: List<LoaderStep>,
  searchParams: URLSearchParams,
  stepIndex = currentStepIndex,
): React.ReactElement {
  return (
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Route path={ROUTE.FACTORY_LOADER}>
        <Provider store={store}>
          <StepApplyResources
            searchParams={searchParams}
            currentStepIndex={stepIndex}
            loaderSteps={loaderSteps}
            tabParam={undefined}
            onNextStep={mockOnNextStep}
            onRestart={mockOnRestart}
          />
        </Provider>
      </Route>
      <Route
        path="*"
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        render={({ history, location }) => {
          testLocation = location;
          return null;
        }}
      />
    </MemoryRouter>
  );
}
