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

import { HomeIcon } from '@patternfly/react-icons';
import { render, RenderResult, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';

import NavigationMainItem from '@/Layout/Navigation/MainItem';
import devfileApi from '@/services/devfileApi';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

import { NavigationItemObject } from '..';

describe('Navigation Item', () => {
  let activeItem = '';
  const item: NavigationItemObject = {
    icon: <HomeIcon />,
    label: 'Home',
    to: '/home',
  };

  function renderComponent(workspaces: devfileApi.DevWorkspace[] = []): RenderResult {
    const store = new FakeStoreBuilder().withDevWorkspaces({ workspaces }).build();
    return render(
      <Provider store={store}>
        <MemoryRouter>
          <NavigationMainItem item={item} activePath={activeItem} />
        </MemoryRouter>
      </Provider>,
    );
  }

  it('should have correct label', () => {
    renderComponent();

    const link = screen.getByRole('link');
    expect(link).toHaveTextContent('Home');
  });

  describe('activation', () => {
    it('should render not active navigation item', () => {
      renderComponent();

      const link = screen.getByRole('link');
      expect(link).not.toHaveAttribute('aria-current');
    });

    it('should render active navigation item', () => {
      activeItem = '/home';
      renderComponent();

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-current');
    });

    it('should activate navigation item on props change', () => {
      activeItem = '';
      const { rerender } = renderComponent();

      activeItem = '/home';
      const store = new FakeStoreBuilder().build();
      rerender(
        <Provider store={store}>
          <MemoryRouter>
            <NavigationMainItem item={item} activePath={activeItem} />
          </MemoryRouter>
        </Provider>,
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-current');
    });
  });
});
