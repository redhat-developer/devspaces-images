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

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { screen, waitFor } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import StartingStepWorkspaceConditions, { ConditionType } from '..';
import { WorkspaceParams } from '../../../../../Routes/routes';
import getComponentRenderer from '../../../../../services/__mocks__/getComponentRenderer';
import { DevWorkspaceBuilder } from '../../../../../store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '../../../../../store/__mocks__/storeBuilder';
import { MIN_STEP_DURATION_MS } from '../../../const';

jest.mock('../../../TimeLimit');
jest.mock('../../../StepTitle');

const mockOnNextStep = jest.fn();
const mockOnRestart = jest.fn();
const mockOnError = jest.fn();
const mockOnHideError = jest.fn();

const { renderComponent } = getComponentRenderer(getComponent);

const namespace = 'che-user';
const workspaceName = 'test-workspace';
const matchParams: WorkspaceParams = {
  namespace,
  workspaceName,
};
const startTimeout = 500;

describe('Starting steps, checking workspace conditions', () => {
  const conditionInProgress: ConditionType = {
    message: 'Preparing networking',
    status: 'False',
    type: 'RoutingReady',
  };
  const conditionReady: ConditionType = {
    message: 'Networking ready',
    status: 'True',
    type: 'RoutingReady',
  };
  const conditionFailed: ConditionType = {
    status: 'Unknown',
    type: 'RoutingReady',
  };

  beforeEach(() => {
    getStoreBuilder();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('condition not found', async () => {
    const store = getStoreBuilder()
      .withDevWorkspaces({
        workspaces: [
          new DevWorkspaceBuilder()
            .withName(workspaceName)
            .withNamespace(namespace)
            .withStatus({ phase: 'STARTING' })
            .build(),
        ],
      })
      .build();

    renderComponent(store, conditionInProgress);

    jest.runAllTimers();

    // nothing should happen
    expect(mockOnError).not.toHaveBeenCalled();
    expect(mockOnNextStep).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();
  });

  test('condition is ready initially', async () => {
    const devworkspace = new DevWorkspaceBuilder()
      .withName(workspaceName)
      .withNamespace(namespace)
      .withStatus({ phase: 'STARTING' })
      .build();
    devworkspace.status!.conditions = [conditionReady];
    const store = getStoreBuilder()
      .withDevWorkspaces({
        workspaces: [devworkspace],
      })
      .build();

    renderComponent(store, conditionReady);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());

    expect(mockOnError).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();
  });

  test('condition is ready later', async () => {
    const devworkspace = new DevWorkspaceBuilder()
      .withName(workspaceName)
      .withNamespace(namespace)
      .withStatus({ phase: 'STARTING' })
      .build();
    devworkspace.status!.conditions = [conditionInProgress];
    const store = getStoreBuilder()
      .withDevWorkspaces({
        workspaces: [devworkspace],
      })
      .build();

    const { reRenderComponent } = renderComponent(store, conditionInProgress);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);
    // need to flush promises
    await Promise.resolve();

    // nothing should happen
    expect(mockOnError).not.toHaveBeenCalled();
    expect(mockOnNextStep).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();

    const nextDevworkspace = new DevWorkspaceBuilder()
      .withName(workspaceName)
      .withNamespace(namespace)
      .withStatus({ phase: 'STARTING' })
      .build();
    nextDevworkspace.status!.conditions = [conditionReady];
    const nextStore = getStoreBuilder()
      .withDwServerConfig({
        timeouts: {
          inactivityTimeout: -1,
          runTimeout: -1,
          startTimeout,
        },
      })
      .withDevWorkspaces({
        workspaces: [nextDevworkspace],
      })
      .build();
    reRenderComponent(nextStore, conditionInProgress);

    // jest.advanceTimersByTime(MIN_STEP_DURATION_MS);
    jest.runAllTimers();

    await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
    expect(mockOnError).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();
  });

  test('condition is failed later', async () => {
    const devworkspace = new DevWorkspaceBuilder()
      .withUID('wksp-123')
      .withName(workspaceName)
      .withNamespace(namespace)
      .withStatus({ phase: 'STARTING' })
      .build();
    devworkspace.status!.conditions = [conditionInProgress];
    const store = getStoreBuilder()
      .withDevWorkspaces({
        workspaces: [devworkspace],
      })
      .build();

    const { reRenderComponent } = renderComponent(store, conditionInProgress);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);
    // need to flush promises
    await Promise.resolve();

    // nothing should happen
    expect(mockOnError).not.toHaveBeenCalled();
    expect(mockOnNextStep).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();

    const nextDevworkspace = new DevWorkspaceBuilder()
      .withUID('wksp-123')
      .withName(workspaceName)
      .withNamespace(namespace)
      .withStatus({ phase: 'STARTING' })
      .build();
    nextDevworkspace.status!.conditions = [conditionFailed];
    const nextStore = getStoreBuilder()
      .withDwServerConfig({
        timeouts: {
          inactivityTimeout: -1,
          runTimeout: -1,
          startTimeout,
        },
      })
      .withDevWorkspaces({
        workspaces: [nextDevworkspace],
      })
      .build();
    reRenderComponent(nextStore, conditionInProgress);

    jest.runAllTimers();

    /* step marked as failed */
    await waitFor(() => expect(screen.queryByTestId('isError')).toBeTruthy());

    /* no alerts should fire */
    expect(mockOnError).not.toHaveBeenCalled();
    expect(mockOnNextStep).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();
  });

  test('workspace fails after condition is ready', async () => {
    const devworkspace = new DevWorkspaceBuilder()
      .withUID('wksp-123')
      .withName(workspaceName)
      .withNamespace(namespace)
      .withStatus({ phase: 'STARTING' })
      .build();
    devworkspace.status!.conditions = [conditionReady];
    const store = getStoreBuilder()
      .withDevWorkspaces({
        workspaces: [devworkspace],
      })
      .build();

    const { reRenderComponent } = renderComponent(store, conditionInProgress);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);
    // need to flush promises
    await Promise.resolve();

    // nothing should happen
    expect(mockOnError).not.toHaveBeenCalled();
    expect(mockOnNextStep).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();

    const nextDevworkspace = new DevWorkspaceBuilder()
      .withUID('wksp-123')
      .withName(workspaceName)
      .withNamespace(namespace)
      .withStatus({ phase: 'STARTING' })
      .build();
    nextDevworkspace.status!.conditions = [conditionFailed];
    const nextStore = getStoreBuilder()
      .withDwServerConfig({
        timeouts: {
          inactivityTimeout: -1,
          runTimeout: -1,
          startTimeout,
        },
      })
      .withDevWorkspaces({
        workspaces: [nextDevworkspace],
      })
      .build();
    reRenderComponent(nextStore, conditionInProgress);

    jest.runAllTimers();
    // try to flush promises
    await Promise.resolve();

    /* step marked as failed */
    expect(screen.queryByTestId('isError')).toBeFalsy();

    /* no alerts should fire */
    expect(mockOnError).not.toHaveBeenCalled();
    expect(mockOnNextStep).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();
  });
});

function getStoreBuilder() {
  return new FakeStoreBuilder().withDwServerConfig({
    timeouts: {
      inactivityTimeout: -1,
      runTimeout: -1,
      startTimeout,
    },
  });
}

function getComponent(
  store: Store,
  condition: ConditionType,
  _matchParams = matchParams,
): React.ReactElement {
  const history = createMemoryHistory();
  const component = (
    <React.Fragment>
      <StartingStepWorkspaceConditions
        distance={0}
        condition={condition}
        history={history}
        matchParams={_matchParams}
        onNextStep={mockOnNextStep}
        onRestart={mockOnRestart}
        onError={mockOnError}
        onHideError={mockOnHideError}
      />
    </React.Fragment>
  );
  return <Provider store={store}>{component}</Provider>;
}
