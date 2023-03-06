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

import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertVariant } from '@patternfly/react-core';
import { LoaderPage } from '..';
import { LoadingStep, List, LoaderStep } from '../../../components/Loader/Step';
import {
  getWorkspaceLoadingSteps,
  buildLoaderSteps,
} from '../../../components/Loader/Step/buildSteps';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';
import { DevWorkspaceBuilder } from '../../../store/__mocks__/devWorkspaceBuilder';
import {
  AlertItem,
  LoaderTab,
  DevWorkspaceStatus,
  ActionCallback,
} from '../../../services/helpers/types';
import devfileApi from '../../../services/devfileApi';
import { constructWorkspace, Workspace } from '../../../services/workspace-adapter';
import getComponentRenderer from '../../../services/__mocks__/getComponentRenderer';

jest.mock('react-tooltip', () => {
  return function DummyTooltip(): React.ReactElement {
    return <div>Dummy Tooltip</div>;
  };
});
jest.mock('../../../components/Loader/Alert');
jest.mock('../../../components/Loader/Progress');
jest.mock('../../../components/WorkspaceLogs');
jest.mock('../../../components/WorkspaceEvents');

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnTabChange = jest.fn();
const mockOnWorkspaceRestart = jest.fn();
const actionCallbacks: ActionCallback[] = [
  {
    title: 'Restart',
    callback: mockOnWorkspaceRestart,
  },
];

const namespace = 'user-che';
const workspaceName = 'wksp-test';
const currentStepId = LoadingStep.INITIALIZE;
const status: keyof typeof DevWorkspaceStatus = 'STARTING';
const tabParam = LoaderTab[LoaderTab.Progress];

describe('Loader page', () => {
  let devWorkspace: devfileApi.DevWorkspace;
  let workspace: Workspace;
  let steps: List<LoaderStep>;
  let store: Store;

  beforeEach(() => {
    const loadingSteps = getWorkspaceLoadingSteps();
    steps = buildLoaderSteps(loadingSteps);
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

  test('component snapshot: creating a workspace', () => {
    const emptyStore = new FakeStoreBuilder().build();
    const snapshot = createSnapshot(emptyStore, {
      tabParam,
      steps: steps.values,
      workspace: undefined,
    });
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('component snapshot: starting a workspace', () => {
    const snapshot = createSnapshot(store, {
      tabParam,
      steps: steps.values,
      workspace,
    });
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  it('should handle tab click', () => {
    renderComponent(store, {
      tabParam,
      steps: steps.values,
      workspace,
    });

    const tabButtonLogs = screen.getByRole('button', { name: 'Logs' });
    userEvent.click(tabButtonLogs);

    expect(mockOnTabChange).toHaveBeenCalledWith(LoaderTab[LoaderTab.Logs]);
  });

  it('should handle reload', () => {
    const alertItem: AlertItem = {
      key: 'alert-id',
      title: 'Failed to start the workspace',
      variant: AlertVariant.danger,
      actionCallbacks,
    };
    renderComponent(store, {
      tabParam,
      steps: steps.values,
      alertItem,
      workspace,
    });

    const reloadButton = screen.getByRole('button', { name: 'Restart' });
    userEvent.click(reloadButton);

    expect(mockOnWorkspaceRestart).toHaveBeenCalledWith();
  });

  it('should render Progress tab active by default', () => {
    renderComponent(store, {
      tabParam,
      steps: steps.values,
      workspace,
    });

    const tabpanelProgress = screen.queryByRole('tabpanel', { name: 'Progress' });
    const tabpanelLogs = screen.queryByRole('tabpanel', { name: 'Logs' });

    // active tab by default
    expect(tabpanelProgress).not.toBeNull();
    // disabled tab
    expect(tabpanelLogs).toBeNull();
  });

  it('should render Logs tab active', () => {
    renderComponent(store, {
      tabParam: LoaderTab[LoaderTab.Logs],
      steps: steps.values,
      workspace,
    });

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
    tabParam: string;
    alertItem?: AlertItem;
    workspace?: Workspace;
  },
): React.ReactElement {
  return (
    <Provider store={store}>
      <LoaderPage
        alertItem={props.alertItem}
        tabParam={props.tabParam}
        currentStepId={currentStepId}
        steps={props.steps}
        workspace={props.workspace}
        onTabChange={mockOnTabChange}
      />
    </Provider>
  );
}
