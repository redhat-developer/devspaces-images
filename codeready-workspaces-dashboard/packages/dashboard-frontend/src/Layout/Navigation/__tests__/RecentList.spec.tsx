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
import { MemoryRouter } from 'react-router';
import { Nav } from '@patternfly/react-core';
import { Provider } from 'react-redux';
import { RenderResult, render, screen } from '@testing-library/react';
import { Store } from 'redux';

import NavigationRecentList from '../RecentList';
import { convertWorkspace, Workspace } from '../../../services/workspace-adapter';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';
import { createHashHistory } from 'history';
import { createFakeCheWorkspace } from '../../../store/__mocks__/workspace';

jest.mock('react-tooltip', () => {
  return function DummyTooltip(): React.ReactElement {
    return <div>Dummy Tooltip</div>;
  };
});

const cheWorkspaces = [1, 2, 3].map(i => createFakeCheWorkspace('wksp-' + i, 'wksp-' + i));
const workspaces = cheWorkspaces.map(workspace => convertWorkspace(workspace));

describe('Navigation Recent List', () => {
  function renderComponent(store: Store, workspaces: Workspace[]): RenderResult {
    const history = createHashHistory();
    return render(
      <Provider store={store}>
        <MemoryRouter>
          <Nav onSelect={() => jest.fn()} theme="light">
            <NavigationRecentList workspaces={workspaces} activePath="" history={history} />
          </Nav>
        </MemoryRouter>
      </Provider>,
    );
  }

  it('should have correct number of main navigation items', () => {
    const store = createFakeStore();
    renderComponent(store, workspaces);

    const itemLabels = screen.getAllByTestId('recent-workspace-item');
    expect(itemLabels.length).toEqual(workspaces.length);
  });

  it('should have correct navigation item labels', () => {
    const store = createFakeStore();
    renderComponent(store, workspaces);

    const itemLabels = screen.getAllByTestId('recent-workspace-item');

    expect(itemLabels[0]).toHaveTextContent('wksp-1');
    expect(itemLabels[1]).toHaveTextContent('wksp-2');
    expect(itemLabels[2]).toHaveTextContent('wksp-3');
  });

  it('should correctly handle workspaces order', () => {
    const store = createFakeStore();
    const { rerender } = renderComponent(store, workspaces);

    const history = createHashHistory();
    // change workspaces order
    [workspaces[0], workspaces[2]] = [workspaces[2], workspaces[0]];
    rerender(
      <Provider store={store}>
        <MemoryRouter>
          <Nav onSelect={() => jest.fn()} theme="light">
            <NavigationRecentList workspaces={workspaces} activePath="" history={history} />
          </Nav>
        </MemoryRouter>
      </Provider>,
    );

    const itemLabels = screen.getAllByTestId('recent-workspace-item');

    expect(itemLabels[0]).toHaveTextContent('wksp-3');
    expect(itemLabels[1]).toHaveTextContent('wksp-2');
    expect(itemLabels[2]).toHaveTextContent('wksp-1');
  });
});

function createFakeStore(): Store {
  return new FakeStoreBuilder().withCheWorkspaces({ workspaces: cheWorkspaces }).build();
}
