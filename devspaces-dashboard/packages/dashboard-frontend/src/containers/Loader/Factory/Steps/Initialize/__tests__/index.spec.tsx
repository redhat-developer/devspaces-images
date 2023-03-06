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
import { Store } from 'redux';
import StepInitialize, { State } from '..';
import { List, LoaderStep, LoadingStep } from '../../../../../../components/Loader/Step';
import {
  buildLoaderSteps,
  getFactoryLoadingSteps,
} from '../../../../../../components/Loader/Step/buildSteps';
import getComponentRenderer from '../../../../../../services/__mocks__/getComponentRenderer';
import { FakeStoreBuilder } from '../../../../../../store/__mocks__/storeBuilder';
import { buildFactoryParams } from '../../../../buildFactoryParams';
import {
  DEV_WORKSPACE_ATTR,
  ERROR_CODE_ATTR,
  FACTORY_URL_ATTR,
  MIN_STEP_DURATION_MS,
  POLICIES_CREATE_ATTR,
} from '../../../../const';

jest.mock('../../../../../../pages/Loader');

const { renderComponent } = getComponentRenderer(getComponent);

const mockOnNextStep = jest.fn();
const mockOnRestart = jest.fn();
const mockOnTabChange = jest.fn();

const stepId = LoadingStep.INITIALIZE.toString();
const currentStepIndex = 0;
const loadingSteps = getFactoryLoadingSteps('devfile');

const factoryUrl = 'https://factory-url';

describe('Factory Loader, step INITIALIZE', () => {
  let store: Store;
  let loaderSteps: List<LoaderStep>;

  beforeEach(() => {
    store = new FakeStoreBuilder()
      .withInfrastructureNamespace([{ name: 'user-che', attributes: { phase: 'Active' } }])
      .build();
    loaderSteps = buildLoaderSteps(loadingSteps);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  test('factory URL is omitted', async () => {
    const searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: '',
    });

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
    expect(alertBody.textContent).toContain(
      `Repository/Devfile URL is missing. Please specify it via url query param: ${window.location.origin}${window.location.pathname}#/load-factory?url=your-repository-url`,
    );

    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('devworkspace resources URL is omitted', async () => {
    const searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: factoryUrl,
      [DEV_WORKSPACE_ATTR]: '',
    });

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
    expect(alertBody.textContent).toContain('Devworkspace resources URL is missing.');

    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('`invalid_request` error code', async () => {
    const searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: factoryUrl,
      [ERROR_CODE_ATTR]: 'invalid_request',
    });

    renderComponent(store, loaderSteps, searchParams);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('true');

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to create the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual(
      'Could not resolve devfile from private repository because authentication request is missing a parameter, contains an invalid parameter, includes a parameter more than once, or is otherwise invalid.',
    );

    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('`policies.create` valid', async () => {
    const searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: factoryUrl,
      [POLICIES_CREATE_ATTR]: 'peruser',
    });

    renderComponent(store, loaderSteps, searchParams);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
  });

  test('`policies.create` invalid', async () => {
    const wrongPolicy = 'wrong-policy';
    const searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: factoryUrl,
      [POLICIES_CREATE_ATTR]: wrongPolicy,
    });

    renderComponent(store, loaderSteps, searchParams);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('true');

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to create the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual(
      `Unsupported create policy '${wrongPolicy}' is specified while the only following are supported: peruser, perclick. Please fix 'policies.create' parameter and try again.`,
    );

    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('no pre-created infrastructure namespaces', async () => {
    const storeNoNamespace = new FakeStoreBuilder().build();
    const searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: factoryUrl,
    });

    renderComponent(storeNoNamespace, loaderSteps, searchParams);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('true');

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to create the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual(
      'Failed to create a workspace. The infrastructure namespace is required to be created. Please, contact the cluster administrator.',
    );

    expect(mockOnNextStep).not.toHaveBeenCalled();
  });

  test('restart flow', async () => {
    const searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: factoryUrl,
    });
    const localState: Partial<State> = {
      factoryParams: buildFactoryParams(searchParams),
      lastError: new Error('Unexpected error'),
    };

    renderComponent(store, loaderSteps, searchParams, localState);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const restartButton = await screen.findByRole('button', {
      name: 'Click to try again',
    });
    expect(restartButton).toBeDefined();
    userEvent.click(restartButton);

    expect(mockOnRestart).toHaveBeenCalled();
  });

  test('all workspaces limit exceeded', async () => {
    const store = new FakeStoreBuilder()
      .withInfrastructureNamespace([{ name: 'user-che', attributes: { phase: 'Active' } }])
      .withClusterConfig({ allWorkspacesLimit: 0 })
      .build();
    const searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: factoryUrl,
    });

    renderComponent(store, loaderSteps, searchParams);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('true');

    const alertTitle = screen.getByTestId('alert-title');
    expect(alertTitle.textContent).toEqual('Failed to create the workspace');

    const alertBody = screen.getByTestId('alert-body');
    expect(alertBody.textContent).toEqual('You can only keep 0 workspace.');

    expect(mockOnNextStep).not.toHaveBeenCalled();
  });
});

function getComponent(
  store: Store,
  loaderSteps: List<LoaderStep>,
  searchParams: URLSearchParams,
  localState?: Partial<State>,
): React.ReactElement {
  const history = createMemoryHistory();
  const component = (
    <StepInitialize
      currentStepIndex={currentStepIndex}
      history={history}
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
