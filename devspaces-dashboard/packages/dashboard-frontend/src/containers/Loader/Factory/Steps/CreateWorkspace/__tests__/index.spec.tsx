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

import { Store } from 'redux';
import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';
import { screen, waitFor, within } from '@testing-library/react';
import { FakeStoreBuilder } from '../../../../../../store/__mocks__/storeBuilder';
import { List, LoaderStep, LoadingStep } from '../../../../../../components/Loader/Step';
import {
  buildLoaderSteps,
  getFactoryLoadingSteps,
} from '../../../../../../components/Loader/Step/buildSteps';
import getComponentRenderer from '../../../../../../services/__mocks__/getComponentRenderer';
import CreateWorkspace from '..';
import { MIN_STEP_DURATION_MS } from '../../../../const';

jest.mock('../../../../../../pages/Loader/Factory');

const { renderComponent } = getComponentRenderer(getComponent);

const mockOnNextStep = jest.fn();
const mockOnRestart = jest.fn();

const stepId = LoadingStep.CREATE_WORKSPACE.toString();
const currentStepIndex = 1;
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
    const store = new FakeStoreBuilder().build();
    renderComponent(store, loaderSteps, searchParams);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const restartButton = screen.getByRole('button', {
      name: 'Restart',
    });
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
): React.ReactElement {
  return (
    <Provider store={store}>
      <CreateWorkspace
        currentStepIndex={currentStepIndex}
        loaderSteps={loaderSteps}
        searchParams={searchParams}
        tabParam={undefined}
        onNextStep={mockOnNextStep}
        onRestart={mockOnRestart}
      />
    </Provider>
  );
}
