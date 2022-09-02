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
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertVariant } from '@patternfly/react-core';
import WorkspaceLoaderPage from '..';
import { LoadingStep, List, LoaderStep } from '../../../../components/Loader/Step';
import {
  getWorkspaceLoadingSteps,
  buildLoaderSteps,
} from '../../../../components/Loader/Step/buildSteps';
import { AlertItem, LoaderTab } from '../../../../services/helpers/types';
import getComponentRenderer from '../../../../services/__mocks__/getComponentRenderer';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import { FakeStoreBuilder } from '../../../../store/__mocks__/storeBuilder';
import { DevWorkspaceBuilder } from '../../../../store/__mocks__/devWorkspaceBuilder';
import { Workspace, WorkspaceAdapter } from '../../../../services/workspace-adapter';
import { RunningWorkspacesExceededError } from '../../../../store/Workspaces/devWorkspaces';
import { DevWorkspace } from '../../../../services/devfileApi/devWorkspace';
import { actionCreators } from '../../../../store/Workspaces';

jest.mock('react-tooltip', () => {
  return function DummyTooltip(): React.ReactElement {
    return <div>Dummy Tooltip</div>;
  };
});
jest.mock('../../../../components/Loader/Alert');
jest.mock('../../../../components/Loader/Progress');
jest.mock('../../../../components/WorkspaceLogs');
jest.mock('../../Common');

const { renderComponent } = getComponentRenderer(getComponent);

const mockOnWorkspaceRestart = jest.fn();

const currentStepId = LoadingStep.INITIALIZE;

const mockStopWorkspace = jest.fn();
jest.mock('../../../../store/Workspaces');
(actionCreators.stopWorkspace as jest.Mock).mockImplementation(
  (...args) =>
    async () =>
      mockStopWorkspace(...args),
);

describe('Workspace loader page', () => {
  let steps: List<LoaderStep>;

  beforeEach(() => {
    const loadingSteps = getWorkspaceLoadingSteps();
    steps = buildLoaderSteps(loadingSteps);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle reload', () => {
    const alertItem: AlertItem = {
      key: 'alert-id',
      title: 'Failed to start the workspace',
      variant: AlertVariant.danger,
    };
    renderComponent({ steps: steps.values, alertItem });

    const reloadButton = screen.getByRole('button', { name: 'Restart' });
    userEvent.click(reloadButton);

    expect(mockOnWorkspaceRestart).toHaveBeenCalled();

    const activeTab = screen.queryByTestId('active-tab-key');
    expect(activeTab?.textContent).toEqual(LoaderTab.Progress.toString());
  });

  it('should handle reload in verbose mode', () => {
    const alertItem: AlertItem = {
      key: 'alert-id',
      title: 'Failed to start the workspace',
      variant: AlertVariant.danger,
    };
    renderComponent({ steps: steps.values, alertItem });

    const reloadButton = screen.getByRole('button', { name: 'Open in Verbose mode' });
    userEvent.click(reloadButton);

    expect(mockOnWorkspaceRestart).toHaveBeenCalled();

    const activeTab = screen.queryByTestId('active-tab-key');
    expect(activeTab?.textContent).toEqual(LoaderTab.Logs.toString());
  });

  it('should handle tab change', () => {
    renderComponent({ steps: steps.values, initialTab: 'Progress' });

    const activeTab = screen.queryByTestId('active-tab-key');
    expect(activeTab?.textContent).toEqual(LoaderTab.Progress.toString());

    const logsTabButton = screen.getByRole('button', { name: 'Logs' });
    userEvent.click(logsTabButton);

    expect(activeTab?.textContent).toEqual(LoaderTab.Logs.toString());
  });

  describe('workspaces runningLimit has been reached', () => {
    let startedWorkspace1: DevWorkspace;
    let startedWorkspace2: DevWorkspace;
    let stoppedWorkspace: DevWorkspace;
    let currentWorkspace: DevWorkspace;

    beforeEach(() => {
      const namespace = 'user-che';

      startedWorkspace1 = new DevWorkspaceBuilder()
        .withName('bash')
        .withNamespace(namespace)
        .withMetadata({ uid: 'uid-bash' })
        .build();
      startedWorkspace1.spec.started = true;

      startedWorkspace2 = new DevWorkspaceBuilder()
        .withName('python-hello-world')
        .withNamespace(namespace)
        .withMetadata({ uid: 'uid-python-hello-world' })
        .build();
      startedWorkspace2.spec.started = true;

      stoppedWorkspace = new DevWorkspaceBuilder()
        .withName('nodejs-web-app')
        .withNamespace(namespace)
        .withMetadata({ uid: 'uid-nodejs-web-app' })
        .build();

      currentWorkspace = new DevWorkspaceBuilder()
        .withName('golang-example')
        .withNamespace(namespace)
        .withMetadata({ uid: 'uid-golang-example' })
        .build();
    });

    it('should show options if workspace running limit has been reached, and there is only one running workspace', () => {
      const alertItem: AlertItem = {
        key: 'alert-id',
        title:
          'Failed to start the workspace golang-example, reason: You are not allowed to start more workspaces.',
        variant: AlertVariant.warning,
        error: new RunningWorkspacesExceededError('You are not allowed to start more workspaces.'),
      };

      const store = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [startedWorkspace1, stoppedWorkspace, currentWorkspace],
        })
        .build();

      renderComponent(
        { steps: steps.values, alertItem, workspace: new WorkspaceAdapter(currentWorkspace) },
        store,
      );

      const alert = screen.getByTestId('action-links');
      const buttons = within(alert).getAllByRole('button');
      expect(buttons.length).toEqual(2);
      expect(buttons[0].textContent).toEqual(
        'Close running workspace (bash) and restart golang-example',
      );
      expect(buttons[1].textContent).toEqual(
        'Switch to running workspace (bash) to save any changes',
      );
    });

    it('should switch to running workspace when there is only one running workspace and button clicked', async () => {
      createWindowMock({
        href: 'https://che-host/dashboard/#/ide/user-che/golang-example',
        origin: 'https://che-host',
      });
      window.open = jest.fn();

      const alertItem: AlertItem = {
        key: 'alert-id',
        title:
          'Failed to start the workspace golang-example, reason: You are not allowed to start more workspaces.',
        variant: AlertVariant.warning,
        error: new RunningWorkspacesExceededError('You are not allowed to start more workspaces.'),
      };

      const store = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [startedWorkspace1, stoppedWorkspace, currentWorkspace],
        })
        .build();

      renderComponent(
        { steps: steps.values, alertItem, workspace: new WorkspaceAdapter(currentWorkspace) },
        store,
      );

      const alert = screen.getByTestId('action-links');
      const buttons = within(alert).getAllByRole('button');
      expect(buttons.length).toEqual(2);
      expect(buttons[1].textContent).toEqual(
        'Switch to running workspace (bash) to save any changes',
      );

      userEvent.click(buttons[1]);
      await waitFor(() =>
        expect(window.open).toHaveBeenCalledWith(
          'https://che-host/dashboard/#/ide/user-che/bash',
          'uid-bash',
        ),
      );
    });

    it('should close running workspace and restart when there is only one running workspace and button clicked', async () => {
      createWindowMock({
        href: 'https://che-host/dashboard/#/ide/user-che/golang-example',
        origin: 'https://che-host',
      });
      window.open = jest.fn();

      const alertItem: AlertItem = {
        key: 'alert-id',
        title:
          'Failed to start the workspace golang-example, reason: You are not allowed to start more workspaces.',
        variant: AlertVariant.warning,
        error: new RunningWorkspacesExceededError('You are not allowed to start more workspaces.'),
      };

      const store = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [startedWorkspace1, stoppedWorkspace, currentWorkspace],
        })
        .build();

      renderComponent(
        { steps: steps.values, alertItem, workspace: new WorkspaceAdapter(currentWorkspace) },
        store,
      );

      const alert = screen.getByTestId('action-links');
      const buttons = within(alert).getAllByRole('button');
      expect(buttons.length).toEqual(2);
      expect(buttons[0].textContent).toEqual(
        'Close running workspace (bash) and restart golang-example',
      );

      userEvent.click(buttons[0]);

      await waitFor(() => expect(mockStopWorkspace).toHaveBeenCalled());
      await waitFor(() => expect(mockOnWorkspaceRestart).toHaveBeenCalled());
    });

    it('should show options if workspace running limit has been reached, and there more than one running workspaces', async () => {
      createWindowMock({ origin: 'https://che-host' });

      const alertItem: AlertItem = {
        key: 'alert-id',
        title:
          'Failed to start the workspace golang-example, reason: You are not allowed to start more workspaces.',
        variant: AlertVariant.warning,
        error: new RunningWorkspacesExceededError('You are not allowed to start more workspaces.'),
      };

      const store = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [startedWorkspace1, startedWorkspace2, stoppedWorkspace, currentWorkspace],
        })
        .build();

      const spyWindowLocation = jest.spyOn(window.location, 'href', 'set');

      renderComponent(
        { steps: steps.values, alertItem, workspace: new WorkspaceAdapter(currentWorkspace) },
        store,
      );

      const button = screen.getByRole('button', { name: 'Return to dashboard' });
      userEvent.click(button);
      await waitFor(() =>
        expect(spyWindowLocation).toHaveBeenCalledWith('https://che-host/dashboard/'),
      );
    });
  });

  function createWindowMock(location: { href?: string; origin?: string }) {
    delete (window as any).location;
    (window.location as any) = {
      origin: location.origin,
    };
    Object.defineProperty(window.location, 'href', {
      set: () => {
        // no-op
      },
      get: () => {
        return location.href;
      },
      configurable: true,
    });
  }
});

function getComponent(
  props: {
    steps: LoaderStep[];
    initialTab?: keyof typeof LoaderTab;
    alertItem?: AlertItem;
    workspace?: Workspace;
  },
  store?: Store,
): React.ReactElement {
  if (!store) {
    store = new FakeStoreBuilder().build();
  }

  return (
    <Provider store={store}>
      <WorkspaceLoaderPage
        alertItem={props.alertItem}
        currentStepId={currentStepId}
        onRestart={mockOnWorkspaceRestart}
        steps={props.steps}
        tabParam={'Progress'}
        workspace={props.workspace}
      />
    </Provider>
  );
}
