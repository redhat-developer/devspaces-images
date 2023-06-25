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
import { createMemoryHistory, History } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import { LoaderPage, Props } from '..';
import devfileApi from '../../../services/devfileApi';
import { LoaderTab } from '../../../services/helpers/types';
import { constructWorkspace, Workspace } from '../../../services/workspace-adapter';
import getComponentRenderer from '../../../services/__mocks__/getComponentRenderer';
import { DevWorkspaceBuilder } from '../../../store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';

jest.mock('react-tooltip', () => {
  return function DummyTooltip(): React.ReactElement {
    return <div>Dummy Tooltip</div>;
  };
});

jest.mock('../../../components/WorkspaceProgress');
jest.mock('../../../components/WorkspaceLogs');
jest.mock('../../../components/WorkspaceEvents');

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnTabChange = jest.fn();

const namespace = 'user-che';
const workspaceName = 'wksp-test';
const tabParam = LoaderTab.Progress;

describe('Loader page', () => {
  let devWorkspace: devfileApi.DevWorkspace;
  let workspace: Workspace;
  let store: Store;
  let history: History;

  beforeEach(() => {
    history = createMemoryHistory();

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

  test('snapshot, creating workspace flow', () => {
    const emptyStore = new FakeStoreBuilder().build();
    const snapshot = createSnapshot(emptyStore, {
      history,
      tabParam,
      workspace: undefined,
    });
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('snapshot, starting workspace flow', () => {
    const snapshot = createSnapshot(store, {
      history,
      tabParam,
      workspace,
    });
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  it('should handle tab click', () => {
    renderComponent(store, {
      history,
      tabParam,
      workspace,
    });

    const tabButtonLogs = screen.getByRole('button', { name: 'Logs' });
    userEvent.click(tabButtonLogs);

    expect(mockOnTabChange).toHaveBeenCalledWith(LoaderTab.Logs);
  });

  it('should render Logs tab active', () => {
    renderComponent(store, {
      history,
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
      history,
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
      history,
      tabParam,
      workspace: constructWorkspace(devWorkspaceReady),
    });

    expect(screen.queryByRole('heading')).toHaveTextContent('Starting workspace');
  });
});

function getComponent(
  store: Store,
  props: Omit<Props, 'onTabChange' | 'searchParams'>,
): React.ReactElement {
  return (
    <Provider store={store}>
      <LoaderPage
        history={props.history}
        tabParam={props.tabParam}
        searchParams={new URLSearchParams()}
        workspace={props.workspace}
        onTabChange={mockOnTabChange}
      />
    </Provider>
  );
}
