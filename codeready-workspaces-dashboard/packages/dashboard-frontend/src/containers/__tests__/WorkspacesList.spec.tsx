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

import 'reflect-metadata';
import React from 'react';
import { Provider } from 'react-redux';
import { RenderResult, render, screen } from '@testing-library/react';
import { createHashHistory } from 'history';
import { AppThunk } from '../../store';
import { Action, Store } from 'redux';
import { ActionCreators } from '../../store/Workspaces';
import WorkspacesList from '../WorkspacesList';
import { FakeStoreBuilder } from '../../store/__mocks__/storeBuilder';
import { createFakeCheWorkspace } from '../../store/__mocks__/workspace';

let isLoadingResult = false;
let workspaces = [0, 1, 2, 3, 4].map(i =>
  createFakeCheWorkspace('workspace-' + i, 'workspace-' + i),
);

jest.mock('../../store/Workspaces/index', () => {
  return {
    actionCreators: {
      requestWorkspaces: (): AppThunk<Action, Promise<void>> => async (): Promise<void> => {
        return Promise.resolve();
      },
    } as ActionCreators,
  };
});
jest.mock('../../store/Workspaces/selectors.ts', () => {
  return {
    selectIsLoading: jest.fn(() => isLoadingResult),
    selectAllWorkspaces: () => workspaces,
    selectWorkspacesError: () => undefined,
  };
});
jest.mock('../../pages/WorkspacesList', () => {
  const FakeWorkspacesList = () => <div>Workspaces List Page</div>;
  FakeWorkspacesList.displayName = 'WorkspacesList';
  return FakeWorkspacesList;
});
jest.mock('../../components/Fallback', () => <div>Fallback Spinner</div>);

describe('Workspaces List Container', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('workspaces are fetched', () => {
    it('should show the workspaces list', () => {
      renderComponent(workspaces);

      expect(screen.queryByText('Workspaces List Page')).toBeTruthy();
    });
  });

  describe('while fetching workspaces', () => {
    it('should show the fallback', () => {
      isLoadingResult = true;
      workspaces = [];
      renderComponent(workspaces);

      expect(screen.queryByText('Fallback Spinner')).toBeTruthy();
    });
  });
});

function renderComponent(workspaces: che.Workspace[]): RenderResult {
  const store = createFakeStore(workspaces);
  const history = createHashHistory();
  return render(
    <Provider store={store}>
      <WorkspacesList history={history}></WorkspacesList>
    </Provider>,
  );
}

function createFakeStore(workspaces: che.Workspace[]): Store {
  return new FakeStoreBuilder()
    .withCheWorkspaces({
      workspaces,
    })
    .build();
}
