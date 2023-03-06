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
import CreateWorkspace, { State } from '..';
import { List, LoaderStep, LoadingStep } from '../../../../../../components/Loader/Step';
import {
  buildLoaderSteps,
  getFactoryLoadingSteps,
} from '../../../../../../components/Loader/Step/buildSteps';
import getComponentRenderer from '../../../../../../services/__mocks__/getComponentRenderer';
import { FakeStoreBuilder } from '../../../../../../store/__mocks__/storeBuilder';
import { buildFactoryParams } from '../../../../buildFactoryParams';
import { MIN_STEP_DURATION_MS } from '../../../../const';

jest.mock('../../../../../../pages/Loader');

const { renderComponent } = getComponentRenderer(getComponent);

const mockOnNextStep = jest.fn();
const mockOnRestart = jest.fn();
const mockOnTabChange = jest.fn();

const stepId = LoadingStep.CREATE_WORKSPACE.toString();
const currentStepIndex = 2;
const loadingSteps = getFactoryLoadingSteps('devfile');
const searchParams = new URLSearchParams();

describe('Factory Loader container, step CREATE_WORKSPACE', () => {
  let loaderSteps: List<LoaderStep>;

  beforeEach(() => {
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
    renderComponent(store, loaderSteps, searchParams, localState);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const restartButton = await screen.findByRole('button', {
      name: 'Click to try again',
    });
    expect(restartButton).toBeDefined();
    userEvent.click(restartButton);

    expect(mockOnRestart).toHaveBeenCalled();
  });

  it('should switch to the next step', async () => {
    const store = new FakeStoreBuilder().build();

    renderComponent(store, loaderSteps, searchParams);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
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
    <CreateWorkspace
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
