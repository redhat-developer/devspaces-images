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

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import WorkspaceLoader from '..';
import {
  buildLoaderSteps,
  getWorkspaceLoadingSteps,
} from '../../../../components/Loader/Step/buildSteps';
import { Workspace } from '../../../../services/workspace-adapter';
import getComponentRenderer from '../../../../services/__mocks__/getComponentRenderer';
import { FakeStoreBuilder } from '../../../../store/__mocks__/storeBuilder';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

jest.mock('../Steps/Initialize');
jest.mock('../Steps/OpenWorkspace');
jest.mock('../Steps/StartWorkspace');
jest.mock('../../CommonSteps/CheckRunningWorkspacesLimit');
jest.mock('../../findTargetWorkspace.ts', () => {
  return {
    __esModule: true,
    default: () => {
      return {} as Workspace;
    },
  };
});

const { renderComponent } = getComponentRenderer(getComponent);

const mockOnNextStep = jest.fn();
const mockOnRestart = jest.fn();
const mockOnTabChange = jest.fn();

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

  describe('Step CHECK_RUNNING_WORKSPACES_LIMIT', () => {
    const currentStepIndex = 1;

    test('render step', async () => {
      const store = new FakeStoreBuilder().build();

      renderComponent(store, currentStepIndex);

      expect(screen.queryByText('Step check running workspaces limit')).not.toBeNull();
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
    const currentStepIndex = 2;

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
    const currentStepIndex = 3;

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
  const history = createMemoryHistory();
  return (
    <Provider store={store}>
      <WorkspaceLoader
        currentStepIndex={currentStepIndex}
        history={history}
        loaderSteps={loaderSteps}
        matchParams={matchParams}
        tabParam={undefined}
        onNextStep={mockOnNextStep}
        onRestart={mockOnRestart}
        onTabChange={mockOnTabChange}
      />
    </Provider>
  );
}
