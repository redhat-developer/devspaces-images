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
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Nav } from '@patternfly/react-core';

import NavigationMainList from '../MainList';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';
import { Provider } from 'react-redux';
import { createFakeCheWorkspace } from '../../../store/__mocks__/workspace';

describe('Navigation Main List', () => {

  it('should have correct number of main navigation items', () => {
    render(buildElement());

    const navLinks = screen.getAllByRole('link');
    expect(navLinks.length).toEqual(2);
  });

  it('should have correct navigation item labels', () => {
    render(buildElement());

    const navLinks = screen.getAllByRole('link');

    expect(navLinks[0]).toHaveTextContent('Create Workspace');
    expect(navLinks[1]).toHaveTextContent('Workspaces (0)');
  });

  it('should have correct navigation item workspaces quantity', () => {
    let workspaces = [0, 1, 2, 3, 4].map(i => createFakeCheWorkspace('works-' + i, 'works-' + i));
    const { rerender } = render(buildElement(workspaces));

    expect(screen.queryByRole('link', { name: 'Workspaces (5)' })).toBeInTheDocument();

    workspaces = [0, 1, 2].map(i => createFakeCheWorkspace('works-' + i, 'works-' + i));
    rerender(buildElement(workspaces));

    expect(screen.queryByRole('link', { name: 'Workspaces (3)' })).toBeInTheDocument();
  });

});

function buildElement(workspaces: che.Workspace[] = []): JSX.Element {
  const store = new FakeStoreBuilder().withCheWorkspaces({ workspaces }).build();
  return (<Provider store={store}>
    <MemoryRouter>
      <Nav
        onSelect={() => jest.fn()}
        theme="light"
      >
        <NavigationMainList activePath="" />
      </Nav>
    </MemoryRouter>
  </Provider>);
}
