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

import {
  conditionChangedTo,
  conditionError,
  conditionStatusFalse,
  conditionStatusTrue,
} from '@/components/WorkspaceProgress/StartingSteps/WorkspaceConditions/__tests__/fixtures';
import { ConditionType } from '@/components/WorkspaceProgress/utils';
import { WorkspaceParams } from '@/Routes/routes';
import getComponentRenderer from '@/services/__mocks__/getComponentRenderer';

import StartingStepWorkspaceConditions from '..';

jest.mock('../../../TimeLimit');
jest.mock('../../../StepTitle');

const mockOnNextStep = jest.fn();
const mockOnRestart = jest.fn();
const mockOnError = jest.fn();
const mockOnHideError = jest.fn();

const { renderComponent, createSnapshot } = getComponentRenderer(getComponent);

const namespace = 'che-user';
const workspaceName = 'test-workspace';
const matchParams: WorkspaceParams = {
  namespace,
  workspaceName,
};

describe('Starting steps, checking workspace conditions', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('snapshot - condition in-progress', () => {
    const snapshot = createSnapshot(conditionStatusFalse);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('snapshot - condition ready', () => {
    const snapshot = createSnapshot(conditionStatusTrue);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('snapshot - condition failed', () => {
    const snapshot = createSnapshot(conditionError);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('in progress 1', async () => {
    const [condition] = conditionChangedTo.inProgress1;
    renderComponent(condition);

    expect(screen.queryByTestId('isError')).toBeFalsy();
    expect(screen.queryByTestId('distance')?.textContent).toEqual('0');
  });

  test('in progress 2', async () => {
    const [condition, prevCondition] = conditionChangedTo.inProgress2;
    const { reRenderComponent } = renderComponent(prevCondition!);

    expect(screen.queryByTestId('isError')).toBeFalsy();
    expect(screen.queryByTestId('distance')?.textContent).toEqual('0');

    reRenderComponent(condition);

    expect(screen.queryByTestId('isError')).toBeFalsy();
    expect(screen.queryByTestId('distance')?.textContent).toEqual('0');
  });

  test('done 1', async () => {
    const [condition, prevCondition] = conditionChangedTo.done1;
    const { reRenderComponent } = renderComponent(prevCondition!);

    expect(screen.queryByTestId('isError')).toBeFalsy();
    expect(screen.queryByTestId('distance')?.textContent).toEqual('0');

    reRenderComponent(condition);

    expect(screen.queryByTestId('isError')).toBeFalsy();
    expect(screen.queryByTestId('distance')?.textContent).toEqual('1');
  });

  test('done 2', async () => {
    const [condition, prevCondition] = conditionChangedTo.done2;
    const { reRenderComponent } = renderComponent(prevCondition!);

    expect(screen.queryByTestId('isError')).toBeFalsy();
    // expect(screen.queryByTestId('distance')?.textContent).toEqual('0');

    reRenderComponent(condition);

    expect(screen.queryByTestId('isError')).toBeFalsy();
    expect(screen.queryByTestId('distance')?.textContent).toEqual('1');
  });

  test('fail 1', async () => {
    const [condition, prevCondition] = conditionChangedTo.fail1;
    const { reRenderComponent } = renderComponent(prevCondition!);

    expect(screen.queryByTestId('isError')).toBeFalsy();
    expect(screen.queryByTestId('distance')?.textContent).toEqual('0');

    reRenderComponent(condition);

    await waitFor(() => expect(screen.queryByTestId('isError')).toBeTruthy());
    expect(screen.queryByTestId('distance')?.textContent).toEqual('1');
  });

  test('fail 2', async () => {
    const [condition, prevCondition] = conditionChangedTo.fail2;
    const { reRenderComponent } = renderComponent(prevCondition!);

    expect(screen.queryByTestId('isError')).toBeFalsy();
    expect(screen.queryByTestId('distance')?.textContent).toEqual('0');

    reRenderComponent(condition);

    await waitFor(() => expect(screen.queryByTestId('isError')).toBeTruthy());
    expect(screen.queryByTestId('distance')?.textContent).toEqual('1');
  });

  test('fail 3', async () => {
    const [condition] = conditionChangedTo.fail3;

    renderComponent(condition);

    await waitFor(() => expect(screen.queryByTestId('isError')).toBeTruthy());
    expect(screen.queryByTestId('distance')?.textContent).toEqual('1');
  });
});

function getComponent(condition: ConditionType, _matchParams = matchParams): React.ReactElement {
  const history = createMemoryHistory();
  return (
    <React.Fragment>
      <StartingStepWorkspaceConditions
        distance={0}
        hasChildren={false}
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
}
