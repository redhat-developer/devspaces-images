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
import { createMemoryHistory } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { Action, Store } from 'redux';
import StepFetchResources, { State } from '..';
import { List, LoaderStep, LoadingStep } from '../../../../../../../components/Loader/Step';
import {
  buildLoaderSteps,
  getFactoryLoadingSteps,
} from '../../../../../../../components/Loader/Step/buildSteps';
import devfileApi from '../../../../../../../services/devfileApi';
import getComponentRenderer from '../../../../../../../services/__mocks__/getComponentRenderer';
import { AppThunk } from '../../../../../../../store';
import { ActionCreators } from '../../../../../../../store/DevfileRegistries';
import { FakeStoreBuilder } from '../../../../../../../store/__mocks__/storeBuilder';
import { buildFactoryParams } from '../../../../../buildFactoryParams';
import {
  DEV_WORKSPACE_ATTR,
  FACTORY_URL_ATTR,
  MIN_STEP_DURATION_MS,
  TIMEOUT_TO_RESOLVE_SEC,
} from '../../../../../const';

jest.mock('../../../../../../../pages/Loader');

const mockRequestResources = jest.fn();
jest.mock('../../../../../../../store/DevfileRegistries', () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  return {
    actionCreators: {
      requestResources:
        (
          ...args: Parameters<ActionCreators['requestResources']>
        ): AppThunk<Action, Promise<void>> =>
        async (): Promise<void> =>
          mockRequestResources(...args),
    } as ActionCreators,
  };
  /* eslint-enable @typescript-eslint/no-unused-vars */
});

const { renderComponent } = getComponentRenderer(getComponent);

const mockOnNextStep = jest.fn();
const mockOnRestart = jest.fn();
const mockOnTabChange = jest.fn();

const stepId = LoadingStep.CREATE_WORKSPACE__FETCH_RESOURCES.toString();
const currentStepIndex = 3;
const loadingSteps = getFactoryLoadingSteps('devworkspace');

const resourcesUrl = 'https://resources-url';
const factoryUrl = 'https://factory-url';

describe('Factory Loader container, step CREATE_WORKSPACE__FETCHING_RESOURCES', () => {
  let loaderSteps: List<LoaderStep>;
  let searchParams: URLSearchParams;

  beforeEach(() => {
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
    userEvent.click(restartButton);

    expect(mockOnRestart).toHaveBeenCalled();
  });

  test('resources are already resolved', async () => {
    const store = new FakeStoreBuilder()
      .withDevfileRegistries({
        devWorkspaceResources: {
          [resourcesUrl]: {
            resources: [{} as devfileApi.DevWorkspace, {} as devfileApi.DevWorkspaceTemplate],
          },
        },
      })
      .build();

    renderComponent(store, loaderSteps, searchParams);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());

    expect(mockRequestResources).not.toHaveBeenCalled();
  });

  test('fetch pre-built resources', async () => {
    const store = new FakeStoreBuilder().build();

    renderComponent(store, loaderSteps, searchParams);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    await waitFor(() => expect(mockRequestResources).toHaveBeenCalled());
  });

  test(`fetch a broken url`, async () => {
    const store = new FakeStoreBuilder().build();

    const rejectReason = 'Not found.';
    mockRequestResources.mockRejectedValueOnce(rejectReason);

    renderComponent(store, loaderSteps, searchParams);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);
    const hasError = within(currentStep).getByTestId('hasError');
    await waitFor(() => expect(hasError.textContent).toEqual('true'));

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to create the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual(rejectReason);

    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('resources took more than TIMEOUT_TO_RESOLVE_SEC to fetch', async () => {
    const store = new FakeStoreBuilder().build();

    renderComponent(store, loaderSteps, searchParams);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    await waitFor(() => expect(mockRequestResources).toHaveBeenCalled());
    expect(mockOnNextStep).not.toHaveBeenCalled();

    // wait a bit more than necessary to end the devfile resolving timeout
    const time = (TIMEOUT_TO_RESOLVE_SEC + 1) * 1000;
    jest.advanceTimersByTime(time);

    await waitFor(() => expect(hasError.textContent).toEqual('true'));

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to create the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual(
      `Pre-built resources haven't been fetched in the last ${TIMEOUT_TO_RESOLVE_SEC} seconds.`,
    );

    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('resources fetched successfully', async () => {
    const store = new FakeStoreBuilder().build();

    const { reRenderComponent } = renderComponent(store, loaderSteps, searchParams);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    await waitFor(() => expect(mockRequestResources).toHaveBeenCalled());
    expect(mockOnNextStep).not.toHaveBeenCalled();

    // wait a bit less than the devfile resolving timeout
    const time = (TIMEOUT_TO_RESOLVE_SEC - 1) * 1000;
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
      .build();
    reRenderComponent(nextStore, loaderSteps, searchParams);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    await waitFor(() => expect(hasError.textContent).toEqual('false'));

    await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
  });
});

function getComponent(
  store: Store,
  loaderSteps: List<LoaderStep>,
  searchParams: URLSearchParams,
  stepIndex = currentStepIndex,
  localState?: Partial<State>,
): React.ReactElement {
  const history = createMemoryHistory();
  const component = (
    <StepFetchResources
      history={history}
      currentStepIndex={stepIndex}
      loaderSteps={loaderSteps}
      searchParams={searchParams}
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
