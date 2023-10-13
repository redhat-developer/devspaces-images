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

import 'reflect-metadata';

import { render, RenderResult, screen } from '@testing-library/react';
import { createHashHistory } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { Action, Store } from 'redux';

import WorkspacesList from '@/containers/WorkspacesList';
import { Workspace } from '@/services/workspace-adapter';
import { AppThunk } from '@/store';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { ActionCreators } from '@/store/Workspaces';

jest.mock('../../store/Workspaces/index', () => {
  return {
    actionCreators: {
      requestWorkspaces: (): AppThunk<Action, Promise<void>> => async (): Promise<void> => {
        return Promise.resolve();
      },
    } as ActionCreators,
  };
});
jest.mock('../../pages/WorkspacesList', () => {
  const FakeWorkspacesList = (props: { workspaces: Workspace[] }): React.ReactElement => {
    const ids = props.workspaces.map(wksp => (
      <span data-testid="workspace" key={wksp.uid}>
        {wksp.name}
      </span>
    ));
    return (
      <div>
        Workspaces List Page
        <div data-testid="workspaces-list">{ids}</div>
      </div>
    );
  };
  FakeWorkspacesList.displayName = 'WorkspacesList';
  return FakeWorkspacesList;
});
jest.mock('../../components/Fallback', () => <div>Fallback Spinner</div>);

describe('Workspaces List Container', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('workspaces are fetched', () => {
    it('should show the workspaces list', () => {
      const workspaces = [0, 1, 2].map(i =>
        new DevWorkspaceBuilder()
          .withId('workspace-' + i)
          .withName('workspace-' + i)
          .build(),
      );
      const store = new FakeStoreBuilder()
        .withDevWorkspaces({ workspaces }, false)
        .withWorkspaces({}, false)
        .build();
      renderComponent(store);

      expect(screen.queryByText('Workspaces List Page')).toBeTruthy();
    });
  });

  describe('while fetching workspaces', () => {
    it('should show the fallback', () => {
      const store = new FakeStoreBuilder()
        .withDevWorkspaces({ workspaces: [] }, true)
        .withWorkspaces({}, true)
        .build();
      renderComponent(store);

      expect(screen.queryByText('Fallback Spinner')).toBeTruthy();
    });
  });
});

function renderComponent(store: Store): RenderResult {
  const history = createHashHistory();
  return render(
    <Provider store={store}>
      <WorkspacesList history={history}></WorkspacesList>
    </Provider>,
  );
}
