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
import FactoryLoader from '..';
import { List, LoaderStep } from '../../../../components/Loader/Step';
import {
  buildLoaderSteps,
  getFactoryLoadingSteps,
} from '../../../../components/Loader/Step/buildSteps';
import getComponentRenderer from '../../../../services/__mocks__/getComponentRenderer';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

jest.mock('../Steps/Initialize');
jest.mock('../Steps/CreateWorkspace');
jest.mock('../Steps/Fetch/Devfile');
jest.mock('../Steps/Fetch/Resources');
jest.mock('../Steps/CheckExistingWorkspaces');
jest.mock('../Steps/Apply/Devfile');
jest.mock('../Steps/Apply/Resources');
jest.mock('../../CommonSteps/CheckRunningWorkspacesLimit');

const { renderComponent } = getComponentRenderer(getComponent);

const mockOnNextStep = jest.fn();
const mockOnRestart = jest.fn();
const mockOnTabChange = jest.fn();

describe('Factory Loader container', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  describe('Step INITIALIZE', () => {
    const loaderSteps = buildLoaderSteps(getFactoryLoadingSteps('devworkspace'));
    const currentStepIndex = 0;

    test('render step', async () => {
      renderComponent(loaderSteps, currentStepIndex);

      expect(screen.queryByText('Step initialize')).not.toBeNull();
    });

    test('restart the flow', () => {
      renderComponent(loaderSteps, currentStepIndex);

      const restartButton = screen.queryByRole('button', {
        name: 'Restart',
      });
      expect(restartButton).not.toBeNull();

      userEvent.click(restartButton!);

      expect(mockOnRestart).toHaveBeenCalled();
    });

    test('next step switch', () => {
      renderComponent(loaderSteps, currentStepIndex);

      const nextStepButton = screen.queryByRole('button', {
        name: 'Next step',
      });
      expect(nextStepButton).not.toBeNull();

      userEvent.click(nextStepButton!);

      expect(mockOnNextStep).toHaveBeenCalled();
    });
  });

  describe('Step CHECK_RUNNING_WORKSPACES_LIMIT', () => {
    const loaderSteps = buildLoaderSteps(getFactoryLoadingSteps('devworkspace'));
    const currentStepIndex = 1;

    test('render step', async () => {
      renderComponent(loaderSteps, currentStepIndex);

      expect(screen.queryByText('Step check running workspaces limit')).not.toBeNull();
    });

    test('restart the flow', () => {
      renderComponent(loaderSteps, currentStepIndex);

      const restartButton = screen.queryByRole('button', {
        name: 'Restart',
      });
      expect(restartButton).not.toBeNull();

      userEvent.click(restartButton!);

      expect(mockOnRestart).toHaveBeenCalled();
    });

    test('next step switch', () => {
      renderComponent(loaderSteps, currentStepIndex);

      const nextStepButton = screen.queryByRole('button', {
        name: 'Next step',
      });
      expect(nextStepButton).not.toBeNull();

      userEvent.click(nextStepButton!);

      expect(mockOnNextStep).toHaveBeenCalled();
    });
  });

  describe('Step CREATE_WORKSPACE', () => {
    const loaderSteps = buildLoaderSteps(getFactoryLoadingSteps('devworkspace'));
    const currentStepIndex = 2;

    test('render step', async () => {
      renderComponent(loaderSteps, currentStepIndex);

      expect(screen.queryByText('Step create workspace')).not.toBeNull();
    });

    test('restart the flow', () => {
      renderComponent(loaderSteps, currentStepIndex);

      const restartButton = screen.queryByRole('button', {
        name: 'Restart',
      });
      expect(restartButton).not.toBeNull();

      userEvent.click(restartButton!);

      expect(mockOnRestart).toHaveBeenCalled();
    });

    test('next step switch', () => {
      renderComponent(loaderSteps, currentStepIndex);

      const nextStepButton = screen.queryByRole('button', {
        name: 'Next step',
      });
      expect(nextStepButton).not.toBeNull();

      userEvent.click(nextStepButton!);

      expect(mockOnNextStep).toHaveBeenCalled();
    });
  });

  describe('Step CREATE_WORKSPACE__FETCH_RESOURCES', () => {
    const loaderSteps = buildLoaderSteps(getFactoryLoadingSteps('devworkspace'));
    const currentStepIndex = 3;

    test('render step', async () => {
      renderComponent(loaderSteps, currentStepIndex);

      expect(screen.queryByText('Step fetch resources')).not.toBeNull();
    });

    test('restart the flow', () => {
      renderComponent(loaderSteps, currentStepIndex);

      const restartButton = screen.queryByRole('button', {
        name: 'Restart',
      });
      expect(restartButton).not.toBeNull();

      userEvent.click(restartButton!);

      expect(mockOnRestart).toHaveBeenCalled();
    });

    test('next step switch', () => {
      renderComponent(loaderSteps, currentStepIndex);

      const nextStepButton = screen.queryByRole('button', {
        name: 'Next step',
      });
      expect(nextStepButton).not.toBeNull();

      userEvent.click(nextStepButton!);

      expect(mockOnNextStep).toHaveBeenCalled();
    });
  });

  describe('Step CREATE_WORKSPACE__FETCH_DEVFILE', () => {
    const loaderSteps = buildLoaderSteps(getFactoryLoadingSteps('devfile'));
    const currentStepIndex = 3;

    test('render step', async () => {
      renderComponent(loaderSteps, currentStepIndex);

      expect(screen.queryByText('Step fetch devfile')).not.toBeNull();
    });

    test('restart the flow', () => {
      renderComponent(loaderSteps, currentStepIndex);

      const restartButton = screen.queryByRole('button', {
        name: 'Restart',
      });
      expect(restartButton).not.toBeNull();

      userEvent.click(restartButton!);

      expect(mockOnRestart).toHaveBeenCalled();
    });

    test('next step switch', () => {
      renderComponent(loaderSteps, currentStepIndex);

      const nextStepButton = screen.queryByRole('button', {
        name: 'Next step',
      });
      expect(nextStepButton).not.toBeNull();

      userEvent.click(nextStepButton!);

      expect(mockOnNextStep).toHaveBeenCalled();
    });
  });

  describe('Step CREATE_WORKSPACE__CHECK_EXISTING_WORKSPACES', () => {
    const loaderSteps = buildLoaderSteps(getFactoryLoadingSteps('devfile'));
    const currentStepIndex = 4;

    test('render step', async () => {
      renderComponent(loaderSteps, currentStepIndex);

      expect(screen.queryByText('Step check existing workspaces')).not.toBeNull();
    });

    test('restart the flow', () => {
      renderComponent(loaderSteps, currentStepIndex);

      const restartButton = screen.queryByRole('button', {
        name: 'Restart',
      });
      expect(restartButton).not.toBeNull();

      userEvent.click(restartButton!);

      expect(mockOnRestart).toHaveBeenCalled();
    });

    test('next step switch', () => {
      renderComponent(loaderSteps, currentStepIndex);

      const nextStepButton = screen.queryByRole('button', {
        name: 'Next step',
      });
      expect(nextStepButton).not.toBeNull();

      userEvent.click(nextStepButton!);

      expect(mockOnNextStep).toHaveBeenCalled();
    });
  });

  describe('Step CREATE_WORKSPACE__APPLY_RESOURCES', () => {
    const loaderSteps = buildLoaderSteps(getFactoryLoadingSteps('devworkspace'));
    const currentStepIndex = 5;

    test('render step', async () => {
      renderComponent(loaderSteps, currentStepIndex);

      expect(screen.queryByText('Step apply resources')).not.toBeNull();
    });

    test('restart the flow', () => {
      renderComponent(loaderSteps, currentStepIndex);

      const restartButton = screen.queryByRole('button', {
        name: 'Restart',
      });
      expect(restartButton).not.toBeNull();

      userEvent.click(restartButton!);

      expect(mockOnRestart).toHaveBeenCalled();
    });

    test('next step switch', () => {
      renderComponent(loaderSteps, currentStepIndex);

      const nextStepButton = screen.queryByRole('button', {
        name: 'Next step',
      });
      expect(nextStepButton).not.toBeNull();

      userEvent.click(nextStepButton!);

      expect(mockOnNextStep).toHaveBeenCalled();
    });
  });

  describe('Step CREATE_WORKSPACE__APPLY_DEVFILE', () => {
    const loaderSteps = buildLoaderSteps(getFactoryLoadingSteps('devfile'));
    const currentStepIndex = 5;

    test('render step', async () => {
      renderComponent(loaderSteps, currentStepIndex);

      expect(screen.queryByText('Step apply devfile')).not.toBeNull();
    });

    test('restart the flow', () => {
      renderComponent(loaderSteps, currentStepIndex);

      const restartButton = screen.queryByRole('button', {
        name: 'Restart',
      });
      expect(restartButton).not.toBeNull();

      userEvent.click(restartButton!);

      expect(mockOnRestart).toHaveBeenCalled();
    });

    test('next step switch', () => {
      renderComponent(loaderSteps, currentStepIndex);

      const nextStepButton = screen.queryByRole('button', {
        name: 'Next step',
      });
      expect(nextStepButton).not.toBeNull();

      userEvent.click(nextStepButton!);

      expect(mockOnNextStep).toHaveBeenCalled();
    });
  });
});

function getComponent(loaderSteps: List<LoaderStep>, currentStepIndex: number): React.ReactElement {
  const searchParams = new URLSearchParams();
  const history = createMemoryHistory();
  return (
    <FactoryLoader
      currentStepIndex={currentStepIndex}
      history={history}
      loaderSteps={loaderSteps}
      searchParams={searchParams}
      matchParams={undefined}
      tabParam={undefined}
      onNextStep={mockOnNextStep}
      onRestart={mockOnRestart}
      onTabChange={mockOnTabChange}
    />
  );
}
