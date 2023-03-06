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

import { StateMock } from '@react-mock/state';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory, MemoryHistory } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import StepCheckExistingWorkspaces, { State } from '..';
import { List, LoaderStep, LoadingStep } from '../../../../../../components/Loader/Step';
import {
  buildLoaderSteps,
  getFactoryLoadingSteps,
} from '../../../../../../components/Loader/Step/buildSteps';
import { ROUTE } from '../../../../../../Routes/routes';
import devfileApi from '../../../../../../services/devfileApi';
import getComponentRenderer from '../../../../../../services/__mocks__/getComponentRenderer';
import { DevWorkspaceResources } from '../../../../../../store/DevfileRegistries';
import { DevWorkspaceBuilder } from '../../../../../../store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '../../../../../../store/__mocks__/storeBuilder';
import { buildFactoryParams } from '../../../../buildFactoryParams';
import {
  DEV_WORKSPACE_ATTR,
  FACTORY_URL_ATTR,
  MIN_STEP_DURATION_MS,
  POLICIES_CREATE_ATTR,
} from '../../../../const';

jest.mock('../../../../../../pages/Loader');

const { renderComponent } = getComponentRenderer(getComponent);
let history: MemoryHistory;

const mockOnNextStep = jest.fn();
const mockOnRestart = jest.fn();
const mockOnTabChange = jest.fn();

const stepId = LoadingStep.CREATE_WORKSPACE__CHECK_EXISTING_WORKSPACES.toString();
const currentStepIndex = 4;

const resourcesUrl = 'https://resources-url';
const factoryUrl = 'https://factory-url';

describe('Factory Loader container, step CREATE_WORKSPACE__CHECK_EXISTING_WORKSPACES', () => {
  beforeEach(() => {
    history = createMemoryHistory({
      initialEntries: [ROUTE.FACTORY_LOADER],
    });

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  describe('creating workspace from resources', () => {
    const loadingSteps = getFactoryLoadingSteps('devworkspace');
    const loaderSteps = buildLoaderSteps(loadingSteps);

    let searchParams: URLSearchParams;

    beforeEach(() => {
      searchParams = new URLSearchParams({
        [FACTORY_URL_ATTR]: factoryUrl,
        [DEV_WORKSPACE_ATTR]: resourcesUrl,
      });
    });

    test('restart flow', async () => {
      const localState: Partial<State> = {
        lastError: new Error('Unexpected error'),
        factoryParams: buildFactoryParams(searchParams),
      };
      const store = new FakeStoreBuilder().build();
      renderComponent(store, loaderSteps, searchParams, currentStepIndex, localState);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      const restartButton = await screen.findByRole('button', {
        name: 'Click to try again',
      });
      expect(restartButton).toBeDefined();
      userEvent.click(restartButton);

      expect(mockOnRestart).toHaveBeenCalled();
    });

    test('policy "perclick"', async () => {
      const searchParams = new URLSearchParams({
        [FACTORY_URL_ATTR]: factoryUrl,
        [POLICIES_CREATE_ATTR]: 'perclick',
        [DEV_WORKSPACE_ATTR]: resourcesUrl,
      });
      const store = new FakeStoreBuilder().build();
      renderComponent(store, loaderSteps, searchParams);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      const currentStepId = screen.getByTestId('current-step-id');
      await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

      jest.runOnlyPendingTimers();

      const currentStep = screen.getByTestId(stepId);
      const hasError = within(currentStep).getByTestId('hasError');
      expect(hasError.textContent).toEqual('false');

      expect(mockOnNextStep).toHaveBeenCalled();
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
        renderComponent(store, loaderSteps, searchParams);

        jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

        const currentStepId = screen.getByTestId('current-step-id');
        await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

        jest.runOnlyPendingTimers();

        const currentStep = screen.getByTestId(stepId);
        const hasError = within(currentStep).getByTestId('hasError');
        expect(hasError.textContent).toEqual('false');

        expect(mockOnNextStep).toHaveBeenCalled();
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

      it('should show warning alert', async () => {
        renderComponent(store, loaderSteps, searchParams);

        jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

        const currentStepId = screen.getByTestId('current-step-id');
        await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

        const currentStep = screen.getByTestId(stepId);
        const hasError = within(currentStep).getByTestId('hasError');
        expect(hasError.textContent).toEqual('true');

        const alertBody = screen.getByTestId('alert-body');
        expect(alertBody.textContent).toEqual(
          `A workspace with the same name (${workspaceName}) has been found. Should you want to open the existing workspace or proceed to create a new one, please choose the corresponding action.`,
        );
      });

      it('should open the existing workspace', async () => {
        renderComponent(store, loaderSteps, searchParams);

        jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

        const currentStepId = screen.getByTestId('current-step-id');
        await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));
        jest.runOnlyPendingTimers();

        const currentStep = screen.getByTestId(stepId);
        const hasError = within(currentStep).getByTestId('hasError');
        expect(hasError.textContent).toEqual('true');

        const openWorkspaceLink = screen.queryByRole('button', {
          name: 'Open the existing workspace',
        });
        expect(openWorkspaceLink).not.toBeNull();

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        userEvent.click(openWorkspaceLink!);
        jest.runOnlyPendingTimers();

        expect(history.location.pathname).toEqual('/ide/user-che/my-project');
      });

      it('should create a new workspace', async () => {
        renderComponent(store, loaderSteps, searchParams);

        jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

        const currentStepId = screen.getByTestId('current-step-id');
        await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));
        jest.runOnlyPendingTimers();

        const currentStep = screen.getByTestId(stepId);
        const hasError = within(currentStep).getByTestId('hasError');
        expect(hasError.textContent).toEqual('true');

        const createNewWorkspaceLink = screen.queryByRole('button', {
          name: 'Create a new workspace',
        });
        expect(createNewWorkspaceLink).not.toBeNull();

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        userEvent.click(createNewWorkspaceLink!);
        jest.runOnlyPendingTimers();

        await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
      });
    });
  });

  describe('creating workspace from devfiles', () => {
    describe('workspace names conflict faced', () => {
      let store: Store;
      let searchParams: URLSearchParams;
      const workspaceName = 'my-project';
      const loadingSteps = getFactoryLoadingSteps('devfile');
      const loaderSteps = buildLoaderSteps(loadingSteps);

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

      it('should show warning alert', async () => {
        renderComponent(store, loaderSteps, searchParams);

        jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

        const currentStepId = screen.getByTestId('current-step-id');
        await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

        const currentStep = screen.getByTestId(stepId);
        const hasError = within(currentStep).getByTestId('hasError');
        expect(hasError.textContent).toEqual('true');

        const alertBody = screen.getByTestId('alert-body');
        expect(alertBody.textContent).toEqual(
          `A workspace with the same name (${workspaceName}) has been found. Should you want to open the existing workspace or proceed to create a new one, please choose the corresponding action.`,
        );
      });

      it('should open the existing workspace', async () => {
        renderComponent(store, loaderSteps, searchParams);

        jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

        const currentStepId = screen.getByTestId('current-step-id');
        await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));
        jest.runOnlyPendingTimers();

        const currentStep = screen.getByTestId(stepId);
        const hasError = within(currentStep).getByTestId('hasError');
        expect(hasError.textContent).toEqual('true');

        const openWorkspaceLink = screen.queryByRole('button', {
          name: 'Open the existing workspace',
        });
        expect(openWorkspaceLink).not.toBeNull();

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        userEvent.click(openWorkspaceLink!);
        jest.runOnlyPendingTimers();

        expect(history.location.pathname).toEqual('/ide/user-che/my-project');
      });

      it('should create a new workspace', async () => {
        renderComponent(store, loaderSteps, searchParams);

        jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

        const currentStepId = screen.getByTestId('current-step-id');
        await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));
        jest.runOnlyPendingTimers();

        const currentStep = screen.getByTestId(stepId);
        const hasError = within(currentStep).getByTestId('hasError');
        expect(hasError.textContent).toEqual('true');

        const createNewWorkspaceLink = screen.queryByRole('button', {
          name: 'Create a new workspace',
        });
        expect(createNewWorkspaceLink).not.toBeNull();

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        userEvent.click(createNewWorkspaceLink!);
        jest.runOnlyPendingTimers();

        await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
      });
    });
  });
});

function getComponent(
  store: Store,
  loaderSteps: List<LoaderStep>,
  searchParams: URLSearchParams,
  stepIndex = currentStepIndex,
  localState?: Partial<State>,
): React.ReactElement {
  const component = (
    <StepCheckExistingWorkspaces
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
