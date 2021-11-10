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

import { render, RenderResult, screen, waitFor } from '@testing-library/react';
import { createHashHistory, History } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { HeaderActionSelect } from '..';
import { WorkspaceAction, WorkspaceStatus } from '../../../../../services/helpers/types';
import { Workspace } from '../../../../../services/workspace-adapter';
import { AppThunk } from '../../../../../store';
import { ActionCreators, ResourceQueryParams } from '../../../../../store/Workspaces';
import { FakeStoreBuilder } from '../../../../../store/__mocks__/storeBuilder';

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
const workspaceId = 'test-workspace-id';
const workspaceStoppedStatus = WorkspaceStatus.STOPPED;
const store = new FakeStoreBuilder()
  .withWorkspaces({
    workspaceId,
    workspaceName,
  })
  .withInfrastructureNamespace([{ name: namespace, attributes: { phase: 'Active' } }], false)
  .withCheWorkspaces({
    workspaces: [
      {
        id: workspaceId,
        namespace,
        status: WorkspaceStatus[workspaceStoppedStatus],
        devfile: {
          apiVersion: 'v1',
          components: [],
          metadata: {
            name: workspaceName,
          },
        },
      },
    ],
  })
  .build();

describe('Workspace WorkspaceAction widget', () => {
  it('should call the callback with OPEN action', async () => {
    const action = WorkspaceAction.OPEN_IDE;
    const history = createHashHistory();
    const component = createComponent(workspaceStoppedStatus, workspaceName, workspaceId, history);

    renderComponent(component);

    const actionDropdown = screen.getByTestId(`${workspaceId}-action-dropdown`);
    actionDropdown.click();

    expect(history.location.pathname).toBe('/');

    const targetAction = screen.getByText(action);
    targetAction.click();

    await waitFor(() =>
      expect(history.location.pathname).toBe(`/ide/${namespace}/test-workspace-name`),
    );
  });

  it('should call the callback with OPEN_IN_VERBOSE_MODE action', async () => {
    const action = WorkspaceAction.START_DEBUG_AND_OPEN_LOGS;
    const history = createHashHistory();
    const component = createComponent(workspaceStoppedStatus, workspaceName, workspaceId, history);

    renderComponent(component);

    const actionDropdown = screen.getByTestId(`${workspaceId}-action-dropdown`);
    actionDropdown.click();

    expect(history.location.pathname).toBe('/');

    const targetAction = screen.getByText(action);
    targetAction.click();

    await waitFor(() =>
      expect(history.location.pathname).toBe(`/ide/${namespace}/test-workspace-name`),
    );
  });

  it('should call the callback with START_IN_BACKGROUND action', () => {
    const action = WorkspaceAction.START_IN_BACKGROUND;
    const history = createHashHistory();
    const component = createComponent(workspaceStoppedStatus, workspaceName, workspaceId, history);

    renderComponent(component);

    const actionDropdown = screen.getByTestId(`${workspaceId}-action-dropdown`);
    actionDropdown.click();

    expect(history.location.pathname).toBe('/');

    const targetAction = screen.getByText(action);
    targetAction.click();

    expect(history.location.pathname).toBe('/');
  });

  it('should not call the callback with STOP_WORKSPACE action if disabled', () => {
    const action = WorkspaceAction.STOP_WORKSPACE;
    const history = createHashHistory();
    renderComponent(createComponent(workspaceStoppedStatus, workspaceName, workspaceId, history));

    const actionDropdown = screen.getByTestId(`${workspaceId}-action-dropdown`);
    actionDropdown.click();

    expect(history.location.pathname).toBe('/');

    const targetAction = screen.getByText(action);
    targetAction.click();

    expect(history.location.pathname).toBe('/');
  });

  it('should call the callback with STOP_WORKSPACE action', () => {
    const action = WorkspaceAction.STOP_WORKSPACE;
    const workspaceStatus = WorkspaceStatus.RUNNING;
    const history = createHashHistory();

    renderComponent(createComponent(workspaceStatus, workspaceName, workspaceId, history));

    const actionDropdown = screen.getByTestId(`${workspaceId}-action-dropdown`);
    actionDropdown.click();

    expect(history.location.pathname).toBe('/');

    const targetAction = screen.getByText(action);
    targetAction.click();

    expect(history.location.pathname).toBe('/');
  });
});

function createComponent(
  workspaceStatus: WorkspaceStatus,
  workspaceName: string,
  workspaceId: string,
  history: History,
): React.ReactElement {
  return (
    <HeaderActionSelect
      workspaceId={workspaceId}
      workspaceName={workspaceName}
      history={history}
      status={workspaceStatus}
    />
  );
}

function renderComponent(component: React.ReactElement): RenderResult {
  return render(<Provider store={store}>{component}</Provider>);
}
