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

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import renderer from 'react-test-renderer';
import { Store } from 'redux';

import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { selectApplications } from '@/store/ClusterInfo/selectors';

import { ApplicationsMenu } from '..';

describe('About Menu', () => {
  global.open = jest.fn();

  const store = createStore();
  const applications = selectApplications(store.getState());

  const component = (
    <Provider store={store}>
      <ApplicationsMenu applications={applications} />
    </Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly render the component', () => {
    expect(renderer.create(component).toJSON()).toMatchSnapshot();
  });

  it('should render the toggle button', () => {
    render(component);

    const toggleButton = screen.queryByRole('button', { name: 'External Applications' });
    expect(toggleButton).toBeTruthy();
  });

  it('should show list of two items', () => {
    render(component);

    const toggleButton = screen.getByRole('button', { name: 'External Applications' });

    fireEvent.click(toggleButton);

    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems.length).toEqual(3);
  });

  it('should have required info', async () => {
    render(component);

    const toggleButton = screen.getByRole('button', { name: 'External Applications' });

    fireEvent.click(toggleButton);

    const nameApp1 = /External App #1/;
    const nameApp2 = /External App #2/;

    expect(screen.queryByRole('menuitem', { name: nameApp1 })).toBeTruthy();
    expect(screen.queryByRole('menuitem', { name: nameApp2 })).toBeTruthy();
  });

  it('should have two groups', () => {
    render(component);

    const toggleButton = screen.getByRole('button', { name: 'External Applications' });

    fireEvent.click(toggleButton);

    const group1 = 'Group 1';
    const group2 = 'Group 2';

    expect(screen.queryByText(group1)).toBeTruthy();
    expect(screen.queryByText(group2)).toBeTruthy();
  });
});

function createStore(): Store {
  return new FakeStoreBuilder()
    .withClusterInfo({
      applications: [
        {
          title: 'External App #1',
          url: 'http://example.com/ext/app/1',
          icon: 'http://example.com/ext/app/1/assets/logo.png',
          group: 'Group 1',
        },
        {
          title: 'External App #2',
          url: 'http://example.com/ext/app/2',
          icon: 'http://example.com/ext/app/2/assets/logo.png',
          group: 'Group 1',
        },
        {
          title: 'External App #3',
          url: 'http://example.com/ext/app/3',
          icon: 'http://example.com/ext/app/3/assets/logo.png',
          group: 'Group 2',
        },
      ],
    })
    .build();
}
