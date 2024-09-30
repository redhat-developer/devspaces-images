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

import { Nav } from '@patternfly/react-core';
import { render, RenderResult, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { Store } from 'redux';

import NavigationRecentList from '@/Layout/Navigation/RecentList';
import devfileApi from '@/services/devfileApi';
import { constructWorkspace, Workspace } from '@/services/workspace-adapter';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

jest.mock('react-tooltip', () => {
  return function DummyTooltip(): React.ReactElement {
    return <div>Dummy Tooltip</div>;
  };
});

let devWorkspaces: devfileApi.DevWorkspace[];
let workspaces: Workspace[];

describe('Navigation Recent List', () => {
  beforeEach(() => {
    devWorkspaces = [1, 2, 3].map(i =>
      new DevWorkspaceBuilder()
        .withId('wksp-' + i)
        .withName('wksp-' + i)
        .build(),
    );
    workspaces = devWorkspaces.map(workspace => constructWorkspace(workspace));
  });

  function renderComponent(store: Store, workspaces: Workspace[]): RenderResult {
    return render(
      <Provider store={store}>
        <MemoryRouter>
          <Nav onSelect={() => jest.fn()} theme="light">
            <NavigationRecentList workspaces={workspaces} activePath="" />
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

    // change workspaces order
    [workspaces[0], workspaces[2]] = [workspaces[2], workspaces[0]];
    rerender(
      <Provider store={store}>
        <MemoryRouter>
          <Nav onSelect={() => jest.fn()} theme="light">
            <NavigationRecentList workspaces={workspaces} activePath="" />
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
  return new FakeStoreBuilder().withDevWorkspaces({ workspaces: devWorkspaces }).build();
}
