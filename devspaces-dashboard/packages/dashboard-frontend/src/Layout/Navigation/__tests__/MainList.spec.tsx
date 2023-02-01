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
import { render, RenderResult, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Nav } from '@patternfly/react-core';
import NavigationMainList from '../MainList';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';
import { Provider } from 'react-redux';
import { DevWorkspaceBuilder } from '../../../store/__mocks__/devWorkspaceBuilder';
import { Store } from 'redux';

describe('Navigation Main List', () => {
  it('should have correct number of main navigation items', () => {
    const store = new FakeStoreBuilder().build();
    renderComponent(store);

    const navLinks = screen.getAllByRole('link');
    expect(navLinks.length).toEqual(2);
  });

  it('should have correct navigation item labels', () => {
    const store = new FakeStoreBuilder().build();
    renderComponent(store);

    const navLinks = screen.getAllByRole('link');

    expect(navLinks[0]).toHaveTextContent('Create Workspace');
    expect(navLinks[1]).toHaveTextContent('Workspaces (0)');
  });

  it('should have correct navigation item workspaces quantity', () => {
    let workspaces = [0, 1, 2, 3, 4].map(i =>
      new DevWorkspaceBuilder()
        .withId('wksp-' + i)
        .withName('wksp-' + i)
        .build(),
    );
    let store = new FakeStoreBuilder().withDevWorkspaces({ workspaces }).build();
    const { rerender } = renderComponent(store);

    expect(screen.queryByRole('link', { name: 'Workspaces (5)' })).toBeInTheDocument();

    workspaces = [0, 1, 2].map(i =>
      new DevWorkspaceBuilder()
        .withId('wksp-' + i)
        .withName('wksp-' + i)
        .build(),
    );
    store = new FakeStoreBuilder().withDevWorkspaces({ workspaces }).build();
    rerender(buildElement(store));

    expect(screen.queryByRole('link', { name: 'Workspaces (3)' })).toBeInTheDocument();
  });
});

function renderComponent(store: Store): RenderResult {
  return render(buildElement(store));
}

function buildElement(store: Store): React.ReactElement {
  return (
    <Provider store={store}>
      <MemoryRouter>
        <Nav onSelect={() => jest.fn()} theme="light">
          <NavigationMainList activePath="" />
        </Nav>
      </MemoryRouter>
    </Provider>
  );
}
