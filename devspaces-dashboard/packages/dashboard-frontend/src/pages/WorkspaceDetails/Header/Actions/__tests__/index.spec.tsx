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

import { render, RenderResult, screen, waitFor } from '@testing-library/react';
import { createHashHistory, History } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import devfileApi from '@/services/devfileApi';
import {
  DeprecatedWorkspaceStatus,
  WorkspaceAction,
  WorkspaceStatus,
} from '@/services/helpers/types';
import { Workspace } from '@/services/workspace-adapter';
import { AppThunk } from '@/store';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { ActionCreators, ResourceQueryParams } from '@/store/Workspaces';

import { HeaderActionSelect } from '..';

/* eslint-disable @typescript-eslint/no-unused-vars */
jest.mock('../../../../../store/Workspaces/index', () => {
  return {
    actionCreators: {
      startWorkspace:
        (workspace: Workspace, params?: ResourceQueryParams): AppThunk<any, Promise<void>> =>
        async (): Promise<void> => {
          return Promise.resolve();
        },
      stopWorkspace:
        (workspace: Workspace): AppThunk<any, Promise<void>> =>
        async (): Promise<void> => {
          return Promise.resolve();
        },
    } as ActionCreators,
  };
});
/* eslint-enable @typescript-eslint/no-unused-vars */

const namespace = 'che';
const workspaceName = 'test-workspace-name';
const workspaceUID = 'test-workspace-id';

let devWorkspace: devfileApi.DevWorkspace;
let store: Store;

describe('Workspace WorkspaceAction widget', () => {
  global.open = jest.fn();

  beforeEach(() => {
    devWorkspace = new DevWorkspaceBuilder()
      .withUID(workspaceUID)
      .withName(workspaceName)
      .withNamespace(namespace)
      .build();
    store = new FakeStoreBuilder()
      .withWorkspaces({
        workspaceUID,
        workspaceName,
      })
      .withInfrastructureNamespace([{ name: namespace, attributes: { phase: 'Active' } }], false)
      .withDevWorkspaces({
        workspaces: [devWorkspace],
      })
      .build();
  });

  it('should provide correct number of actions for a regular workspace', () => {
    const history = createHashHistory();
    const component = createComponent(history);

    renderComponent(component);

    const actionDropdown = screen.getByTestId(`${workspaceUID}-action-dropdown`);
    actionDropdown.click();

    const menuitems = screen.getAllByRole('menuitem');
    expect(menuitems.length).toEqual(6);
  });

  it('should provide correct number of actions for a deprecated workspace', () => {
    const history = createHashHistory();
    const component = createComponent(history, 'Deprecated');

    renderComponent(component);

    const actionButton = screen.queryByRole('button', { name: /delete/i });
    expect(actionButton).toBeTruthy();
  });

  it('should call the callback with OPEN action', async () => {
    const action = WorkspaceAction.OPEN_IDE;
    const history = createHashHistory();
    const component = createComponent(history);

    renderComponent(component);

    const actionDropdown = screen.getByTestId(`${workspaceUID}-action-dropdown`);
    actionDropdown.click();

    expect(history.location.pathname).toBe('/');

    const targetAction = screen.getByText(action);
    targetAction.click();

    await waitFor(() =>
      expect(window.open).toBeCalledWith(`#/ide/${namespace}/test-workspace-name`, workspaceUID),
    );
  });

  it('should call the callback with OPEN_IN_VERBOSE_MODE action', async () => {
    const action = WorkspaceAction.START_DEBUG_AND_OPEN_LOGS;
    const history = createHashHistory();
    const component = createComponent(history);

    renderComponent(component);

    const actionDropdown = screen.getByTestId(`${workspaceUID}-action-dropdown`);
    actionDropdown.click();

    expect(history.location.pathname).toBe('/');

    const targetAction = screen.getByText(action);
    targetAction.click();

    await waitFor(() =>
      expect(window.open).toBeCalledWith(`#/ide/${namespace}/test-workspace-name`, workspaceUID),
    );
  });

  it('should call the callback with START_IN_BACKGROUND action', () => {
    const action = WorkspaceAction.START_IN_BACKGROUND;
    const history = createHashHistory();
    const component = createComponent(history);

    renderComponent(component);

    const actionDropdown = screen.getByTestId(`${workspaceUID}-action-dropdown`);
    actionDropdown.click();

    expect(history.location.pathname).toBe('/');

    const targetAction = screen.getByText(action);
    targetAction.click();

    expect(history.location.pathname).toBe('/');
  });

  it('should not call the callback with STOP_WORKSPACE action if disabled', () => {
    const action = WorkspaceAction.STOP_WORKSPACE;
    const history = createHashHistory();
    renderComponent(createComponent(history));

    const actionDropdown = screen.getByTestId(`${workspaceUID}-action-dropdown`);
    actionDropdown.click();

    expect(history.location.pathname).toBe('/');

    const targetAction = screen.getByText(action);
    targetAction.click();

    expect(history.location.pathname).toBe('/');
  });

  it('should call the callback with STOP_WORKSPACE action', () => {
    const action = WorkspaceAction.STOP_WORKSPACE;
    const history = createHashHistory();

    renderComponent(createComponent(history, WorkspaceStatus.RUNNING));

    const actionDropdown = screen.getByTestId(`${workspaceUID}-action-dropdown`);
    actionDropdown.click();

    expect(history.location.pathname).toBe('/');

    const targetAction = screen.getByText(action);
    targetAction.click();

    expect(history.location.pathname).toBe('/');
  });
});

function createComponent(
  history: History,
  status: WorkspaceStatus | DeprecatedWorkspaceStatus = WorkspaceStatus.STOPPED,
): React.ReactElement {
  return (
    <HeaderActionSelect
      workspaceUID={workspaceUID}
      workspaceName={workspaceName}
      history={history}
      status={status}
    />
  );
}

function renderComponent(component: React.ReactElement): RenderResult {
  return render(<Provider store={store}>{component}</Provider>);
}
