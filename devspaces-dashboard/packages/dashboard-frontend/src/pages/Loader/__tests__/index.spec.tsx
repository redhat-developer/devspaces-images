/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider } from 'react-redux';
import { Location } from 'react-router-dom';
import { Store } from 'redux';

import getComponentRenderer from '@/services/__mocks__/getComponentRenderer';
import devfileApi from '@/services/devfileApi';
import { LoaderTab } from '@/services/helpers/types';
import { constructWorkspace, Workspace } from '@/services/workspace-adapter';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

import { LoaderPage, Props } from '..';

jest.mock('react-tooltip', () => {
  return function DummyTooltip(): React.ReactElement {
    return <div>Dummy Tooltip</div>;
  };
});

jest.mock('@/components/WorkspaceProgress');
jest.mock('@/components/WorkspaceLogs');
jest.mock('@/components/WorkspaceEvents');

const { renderComponent } = getComponentRenderer(getComponent);

const mockOnTabChange = jest.fn();

const namespace = 'user-che';
const workspaceName = 'wksp-test';
const tabParam = LoaderTab.Progress;

describe('Loader page', () => {
  let devWorkspace: devfileApi.DevWorkspace;
  let workspace: Workspace;
  let store: Store;

  beforeEach(() => {
    devWorkspace = new DevWorkspaceBuilder()
      .withNamespace(namespace)
      .withName(workspaceName)
      .withStatus({ phase: 'STARTING' })
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

  it('should handle tab click', async () => {
    renderComponent(store, {
      tabParam,
      workspace,
    });

    const tabButtonLogs = screen.getByRole('tab', { name: 'Logs' });
    await userEvent.click(tabButtonLogs);

    await waitFor(() => expect(mockOnTabChange).toHaveBeenCalledWith(LoaderTab.Logs));
  });

  it('should render Logs tab active', () => {
    renderComponent(store, {
      tabParam: LoaderTab.Logs,
      workspace,
    });

    const tabpanelProgress = screen.queryByRole('tabpanel', { name: 'Progress' });
    const tabpanelLogs = screen.queryByRole('tabpanel', { name: 'Logs' });

    // disabled tab
    expect(tabpanelProgress).toBeNull();
    // active tab
    expect(tabpanelLogs).not.toBeNull();
  });

  it('should update the section header when the workspace is ready', () => {
    const store = new FakeStoreBuilder().build();
    const { reRenderComponent } = renderComponent(store, {
      tabParam,
      workspace: undefined,
    });

    expect(screen.queryByRole('heading')).toHaveTextContent('Creating a workspace');

    const devWorkspaceReady = new DevWorkspaceBuilder()
      .withNamespace(namespace)
      .withName(workspaceName)
      .withStatus({ phase: 'RUNNING' })
      .build();
    const storeReady = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [devWorkspaceReady],
      })
      .build();

    reRenderComponent(storeReady, {
      tabParam,
      workspace: constructWorkspace(devWorkspaceReady),
    });

    expect(screen.queryByRole('heading')).toHaveTextContent('Starting workspace');
  });
});

function getComponent(
  store: Store,
  props: Omit<Props, 'onTabChange' | 'searchParams' | 'location' | 'navigate'>,
): React.ReactElement {
  return (
    <Provider store={store}>
      <LoaderPage
        location={{} as Location}
        navigate={jest.fn()}
        tabParam={props.tabParam}
        searchParams={new URLSearchParams()}
        workspace={props.workspace}
        onTabChange={mockOnTabChange}
      />
    </Provider>
  );
}
