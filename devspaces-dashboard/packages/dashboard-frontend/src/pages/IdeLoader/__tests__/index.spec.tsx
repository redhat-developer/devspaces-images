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
import { Provider } from 'react-redux';
import { Store } from 'redux';
import { render, RenderResult, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import renderer, { ReactTestRenderer } from 'react-test-renderer';
import { AlertVariant } from '@patternfly/react-core';
import { IdeLoader } from '..';
import { IdeLoaderSteps, List, LoaderStep } from '../../../components/Loader/Step';
import { buildIdeLoaderSteps } from '../../../components/Loader/Step/buildSteps';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';
import { DevWorkspaceBuilder } from '../../../store/__mocks__/devWorkspaceBuilder';
import { AlertItem, DevWorkspaceStatus, IdeLoaderTab } from '../../../services/helpers/types';
import devfileApi from '../../../services/devfileApi';
import { constructWorkspace, Workspace } from '../../../services/workspace-adapter';

jest.mock('react-tooltip', () => {
  return function DummyTooltip(): React.ReactElement {
    return <div>Dummy Tooltip</div>;
  };
});
jest.mock('../../../components/Loader/Alert');
jest.mock('../../../components/Loader/Progress');
jest.mock('../../../components/WorkspaceLogs');

const mockOnWorkspaceRestart = jest.fn();

const namespace = 'user-che';
const workspaceName = 'wksp-test';
const matchParams = {
  namespace,
  workspaceName,
};
const currentStepId = IdeLoaderSteps.INITIALIZING;
const status: keyof typeof DevWorkspaceStatus = 'STOPPED';

describe('Ide Loader 2 page', () => {
  let devWorkspace: devfileApi.DevWorkspace;
  let workspace: Workspace;
  let steps: List<LoaderStep>;
  let store: Store;

  beforeEach(() => {
    steps = buildIdeLoaderSteps();
    devWorkspace = new DevWorkspaceBuilder()
      .withNamespace(namespace)
      .withName(workspaceName)
      .withStatus({ phase: status })
      .build();
    store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [devWorkspace],
      })
      .build();
    workspace = constructWorkspace(devWorkspace);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('component snapshot', () => {
    const snapshot = createSnapshot(store, { steps: steps.values, workspace });
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('PROGRESS is default active tab', () => {
    renderComponent(store, { steps: steps.values, workspace });

    const tabpanelProgress = screen.queryByRole('tabpanel', { name: 'Progress' });
    const tabpanelLogs = screen.queryByRole('tabpanel', { name: 'Logs' });

    expect(tabpanelProgress).not.toBeNull();
    expect(tabpanelLogs).toBeNull();
  });

  test('LOGS is initially active tab', () => {
    renderComponent(store, { steps: steps.values, initialTab: 'Logs', workspace });

    const tabpanelProgress = screen.queryByRole('tabpanel', { name: 'Progress' });
    const tabpanelLogs = screen.queryByRole('tabpanel', { name: 'Logs' });

    expect(tabpanelProgress).toBeNull();
    expect(tabpanelLogs).not.toBeNull();
  });

  it('should handle tab click', () => {
    renderComponent(store, { steps: steps.values, workspace });

    const tabButtonLogs = screen.getByRole('button', { name: 'Logs' });
    userEvent.click(tabButtonLogs);

    const tabpanelLogs = screen.queryByRole('tabpanel', { name: 'Logs' });
    expect(tabpanelLogs).not.toBeNull();
  });

  it('should handle reload', () => {
    const alertItem: AlertItem = {
      key: 'alert-id',
      title: 'Failed to start the workspace',
      variant: AlertVariant.danger,
    };
    renderComponent(store, { steps: steps.values, alertItem, workspace });

    const reloadButton = screen.getByRole('button', { name: 'reload' });
    userEvent.click(reloadButton);

    expect(mockOnWorkspaceRestart).toHaveBeenCalledWith();

    const tabpanelProgress = screen.queryByRole('tabpanel', { name: 'Progress' });
    const tabpanelLogs = screen.queryByRole('tabpanel', { name: 'Logs' });

    // active tab
    expect(tabpanelProgress).not.toBeNull();
    // disabled tab
    expect(tabpanelLogs).toBeNull();
  });

  it('should handle reload in verbose mode', () => {
    const alertItem: AlertItem = {
      key: 'alert-id',
      title: 'Failed to start the workspace',
      variant: AlertVariant.danger,
    };
    renderComponent(store, { steps: steps.values, alertItem, workspace });

    const reloadButton = screen.getByRole('button', { name: 'reload-verbose' });
    userEvent.click(reloadButton);

    expect(mockOnWorkspaceRestart).toHaveBeenCalledWith();

    const tabpanelProgress = screen.queryByRole('tabpanel', { name: 'Progress' });
    const tabpanelLogs = screen.queryByRole('tabpanel', { name: 'Logs' });

    // disabled tab
    expect(tabpanelProgress).toBeNull();
    // active tab
    expect(tabpanelLogs).not.toBeNull();
  });
});

function getComponent(
  store: Store,
  props: {
    steps: LoaderStep[];
    initialTab?: keyof typeof IdeLoaderTab;
    alertItem?: AlertItem;
    workspace?: Workspace;
  },
): React.ReactElement {
  return (
    <Provider store={store}>
      <IdeLoader
        alertItem={props.alertItem}
        tabParam={props.initialTab}
        currentStepId={currentStepId}
        steps={props.steps}
        matchParams={matchParams}
        workspace={props.workspace}
        onWorkspaceRestart={mockOnWorkspaceRestart}
      />
    </Provider>
  );
}

function renderComponent(...args: Parameters<typeof getComponent>): RenderResult {
  return render(getComponent(...args));
}

function createSnapshot(...args: Parameters<typeof getComponent>): ReactTestRenderer {
  return renderer.create(getComponent(...args));
}
