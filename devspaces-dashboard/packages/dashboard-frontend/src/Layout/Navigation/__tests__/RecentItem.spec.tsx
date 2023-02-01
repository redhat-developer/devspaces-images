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
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import NavigationRecentItem from '../RecentItem';
import { NavigationRecentItemObject } from '..';
import { createHashHistory } from 'history';
import { Provider } from 'react-redux';
import renderer from 'react-test-renderer';
import { WorkspaceStatus } from '../../../services/helpers/types';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';

jest.mock('../../../components/Workspace/Indicator', () => {
  return function DummyWorkspaceIndicator(): React.ReactElement {
    return <div>Dummy Workspace Indicator</div>;
  };
});

describe('Navigation Item', () => {
  const item: NavigationRecentItemObject = {
    status: WorkspaceStatus.STOPPED,
    label: 'workspace',
    to: '/namespace/workspace',
    isDevWorkspace: false,
    workspaceUID: 'test-wrks-id',
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render navigation item for STOPPED workspace correctly', () => {
    const status = WorkspaceStatus.STOPPED;
    const element = buildElement(Object.assign({}, item, { status }), '', true);

    expect(renderer.create(element).toJSON()).toMatchSnapshot();
  });

  it('should render navigation item for STARTING workspace correctly', () => {
    const status = WorkspaceStatus.STARTING;
    const element = buildElement(Object.assign({}, item, { status }), '', true);

    expect(renderer.create(element).toJSON()).toMatchSnapshot();
  });

  it('should render navigation item for RUNNING workspace correctly', () => {
    const status = WorkspaceStatus.RUNNING;
    const element = buildElement(Object.assign({}, item, { status }), '', true);

    expect(renderer.create(element).toJSON()).toMatchSnapshot();
  });

  it('should render navigation item for STOPPING workspace correctly', () => {
    const status = WorkspaceStatus.STOPPING;
    const element = buildElement(Object.assign({}, item, { status }), '', true);

    expect(renderer.create(element).toJSON()).toMatchSnapshot();
  });

  it('should render navigation item for ERROR workspace correctly', () => {
    const status = WorkspaceStatus.ERROR;
    const element = buildElement(Object.assign({}, item, { status }), '', true);

    expect(renderer.create(element).toJSON()).toMatchSnapshot();
  });

  it('should have correct label', () => {
    render(buildElement(item));

    const link = screen.getByTestId(item.to);
    expect(link).toHaveTextContent('workspace');
  });

  it('should have workspace status icon', () => {
    render(buildElement(item));
    const workspaceStatusIndicator = screen.getByText('Dummy Workspace Indicator');
    expect(workspaceStatusIndicator).toBeDefined();
  });

  describe('activation', () => {
    it('should render not active navigation item', () => {
      render(buildElement(item));

      const link = screen.getByTestId(item.to);
      expect(link).not.toHaveAttribute('aria-current');
    });

    it('should render active navigation item', () => {
      render(buildElement(item, '/namespace/workspace'));

      const link = screen.getByTestId(item.to);
      expect(link).toHaveAttribute('aria-current');
    });

    it('should activate navigation item on props change', () => {
      const { rerender } = render(buildElement(item));

      rerender(buildElement(item, '/namespace/workspace'));

      const link = screen.getByTestId(item.to);
      expect(link).toHaveAttribute('aria-current');
    });
  });
});

function buildElement(
  item: NavigationRecentItemObject,
  activeItem = '',
  isDefaultExpanded = false,
): JSX.Element {
  const store = new FakeStoreBuilder().build();
  const history = createHashHistory();
  return (
    <Provider store={store}>
      <MemoryRouter>
        <NavigationRecentItem
          isDefaultExpanded={isDefaultExpanded}
          item={item}
          activePath={activeItem}
          history={history}
        />
      </MemoryRouter>
    </Provider>
  );
}
