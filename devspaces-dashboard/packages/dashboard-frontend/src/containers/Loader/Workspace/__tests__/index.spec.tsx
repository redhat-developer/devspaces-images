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
import { Action, Store } from 'redux';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { FakeStoreBuilder } from '../../../../store/__mocks__/storeBuilder';
import {
  buildLoaderSteps,
  getWorkspaceLoadingSteps,
} from '../../../../components/Loader/Step/buildSteps';
import getComponentRenderer from '../../../../services/__mocks__/getComponentRenderer';
import { ActionCreators } from '../../../../store/Workspaces';
import { AppThunk } from '../../../../store';
import WorkspaceLoader from '..';
import { Workspace } from '../../../../services/workspace-adapter';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

jest.mock('../Steps/Initialize');
jest.mock('../Steps/OpenWorkspace');
jest.mock('../Steps/StartWorkspace');
jest.mock('../findTargetWorkspace.ts', () => {
  return {
    __esModule: true,
    default: () => {
      return {} as Workspace;
    },
  };
});

const mockDeleteWorkspaceLogs = jest.fn();
jest.mock('../../../../store/Workspaces/index', () => {
  return {
    actionCreators: {
      deleteWorkspaceLogs:
        (...args: Parameters<ActionCreators['deleteWorkspaceLogs']>): AppThunk<Action, void> =>
        (): void => {
          return mockDeleteWorkspaceLogs(...args);
        },
    } as ActionCreators,
  };
});

const { renderComponent } = getComponentRenderer(getComponent);

const mockOnNextStep = jest.fn();
const mockOnRestart = jest.fn();

const namespace = 'che-user';
const workspaceName = 'test-workspace';
const matchParams = {
  namespace,
  workspaceName,
};

const loadingSteps = getWorkspaceLoadingSteps();
const loaderSteps = buildLoaderSteps(loadingSteps);

describe('Workspace loader', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  describe('Step INITIALIZE', () => {
    const currentStepIndex = 0;

    test('render step', async () => {
      const store = new FakeStoreBuilder().build();

      renderComponent(store, currentStepIndex);

      expect(screen.queryByText('Step initialize')).not.toBeNull();
    });

    test('restart the flow', () => {
      const store = new FakeStoreBuilder().build();

      renderComponent(store, currentStepIndex);

      const restartButton = screen.queryByRole('button', {
        name: 'Restart',
      });
      expect(restartButton).not.toBeNull();

      userEvent.click(restartButton!);

      expect(mockOnRestart).toHaveBeenCalled();
      expect(mockDeleteWorkspaceLogs).toHaveBeenCalled();
    });

    test('next step switch', () => {
      const store = new FakeStoreBuilder().build();

      renderComponent(store, currentStepIndex);

      const nextStepButton = screen.queryByRole('button', {
        name: 'Next step',
      });
      expect(nextStepButton).not.toBeNull();

      userEvent.click(nextStepButton!);

      expect(mockOnNextStep).toHaveBeenCalled();
    });
  });

  describe('Step START_WORKSPACE', () => {
    const currentStepIndex = 1;

    test('render step', async () => {
      const store = new FakeStoreBuilder().build();

      renderComponent(store, currentStepIndex);

      expect(screen.queryByText('Step start workspace')).not.toBeNull();
    });

    test('restart the flow', () => {
      const store = new FakeStoreBuilder().build();

      renderComponent(store, currentStepIndex);

      const restartButton = screen.queryByRole('button', {
        name: 'Restart',
      });
      expect(restartButton).not.toBeNull();

      userEvent.click(restartButton!);

      expect(mockOnRestart).toHaveBeenCalled();
      expect(mockDeleteWorkspaceLogs).toHaveBeenCalled();
    });

    test('next step switch', () => {
      const store = new FakeStoreBuilder().build();

      renderComponent(store, currentStepIndex);

      const nextStepButton = screen.queryByRole('button', {
        name: 'Next step',
      });
      expect(nextStepButton).not.toBeNull();

      userEvent.click(nextStepButton!);

      expect(mockOnNextStep).toHaveBeenCalled();
    });
  });

  describe('Step OPEN_WORKSPACE', () => {
    const currentStepIndex = 2;

    test('render step', async () => {
      const store = new FakeStoreBuilder().build();

      renderComponent(store, currentStepIndex);

      expect(screen.queryByText('Step open workspace')).not.toBeNull();
    });

    test('restart the flow', () => {
      const store = new FakeStoreBuilder().build();

      renderComponent(store, currentStepIndex);

      const restartButton = screen.queryByRole('button', {
        name: 'Restart',
      });
      expect(restartButton).not.toBeNull();

      userEvent.click(restartButton!);

      expect(mockOnRestart).toHaveBeenCalled();
      expect(mockDeleteWorkspaceLogs).toHaveBeenCalled();
    });

    test('next step switch', () => {
      const store = new FakeStoreBuilder().build();

      renderComponent(store, currentStepIndex);

      const nextStepButton = screen.queryByRole('button', {
        name: 'Next step',
      });
      expect(nextStepButton).not.toBeNull();

      userEvent.click(nextStepButton!);

      expect(mockOnNextStep).toHaveBeenCalled();
    });
  });
});

function getComponent(store: Store, currentStepIndex: number): React.ReactElement {
  return (
    <Provider store={store}>
      <WorkspaceLoader
        currentStepIndex={currentStepIndex}
        loaderSteps={loaderSteps}
        matchParams={matchParams}
        tabParam={undefined}
        onNextStep={mockOnNextStep}
        onRestart={mockOnRestart}
      />
    </Provider>
  );
}
