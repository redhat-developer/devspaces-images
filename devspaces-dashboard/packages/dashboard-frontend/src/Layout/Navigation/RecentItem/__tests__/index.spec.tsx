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
import { createMemoryHistory } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';

import { NavigationRecentItemObject } from '@/Layout/Navigation';
import NavigationRecentItem from '@/Layout/Navigation/RecentItem';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';
import { WorkspaceStatus } from '@/services/helpers/types';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

jest.mock('@/components/Workspace/Status/Indicator');
jest.mock('@/Layout/Navigation/RecentItemWorkspaceActions', () => {
  return {
    __esModule: true,
    default: () => <div>Mock NavigationItemWorkspaceActions</div>,
  };
});

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

describe('Navigation Item', () => {
  const item: NavigationRecentItemObject = {
    status: WorkspaceStatus.STOPPED,
    label: 'workspace',
    to: '/namespace/workspace',
    isDevWorkspace: false,
    workspaceUID: 'test-wksp-id',
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot with STOPPED status', () => {
    const status = WorkspaceStatus.STOPPED;
    const snapshot = createSnapshot(Object.assign({}, item, { status }), '', true);

    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('snapshot with RUNNING correctly', () => {
    const status = WorkspaceStatus.RUNNING;
    const snapshot = createSnapshot(Object.assign({}, item, { status }), '', true);

    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('navigation item label', () => {
    renderComponent(item);

    const link = screen.getByTestId(item.to);
    expect(link).toHaveTextContent('workspace');
  });

  test('workspace status icon', () => {
    renderComponent(item);
    const workspaceStatusIndicator = screen.queryByText(/Mock Workspace status indicator/);
    expect(workspaceStatusIndicator).not.toBeNull();
  });

  test('navigation item click', () => {
    const mockWindowOpen = jest.fn();
    window.open = mockWindowOpen;
    renderComponent(item);

    const link = screen.getByTestId(item.to);
    link.click();

    expect(mockWindowOpen).toHaveBeenCalled();
  });

  describe('activation', () => {
    test('non-active navigation item', () => {
      renderComponent(item);

      const link = screen.getByTestId(item.to);
      expect(link).not.toHaveAttribute('aria-current');
    });

    test('active navigation item', () => {
      renderComponent(item, '/namespace/workspace');

      const link = screen.getByTestId(item.to);
      expect(link).toHaveAttribute('aria-current');
    });

    test('activate navigation item change', () => {
      const { reRenderComponent } = renderComponent(item);

      reRenderComponent(item, '/namespace/workspace');

      const link = screen.getByTestId(item.to);
      expect(link).toHaveAttribute('aria-current');
    });
  });
});

function getComponent(
  item: NavigationRecentItemObject,
  activeItem = '',
  isDefaultExpanded = false,
): React.ReactElement {
  const store = new FakeStoreBuilder().build();
  const history = createMemoryHistory();
  return (
    <Provider store={store}>
      <MemoryRouter>
        <Nav>
          <NavigationRecentItem
            isDefaultExpanded={isDefaultExpanded}
            item={item}
            activePath={activeItem}
            history={history}
          />
        </Nav>
      </MemoryRouter>
    </Provider>
  );
}
