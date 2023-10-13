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

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Store } from 'redux';

import { ROUTE } from '@/Routes/routes';
import getComponentRenderer from '@/services/__mocks__/getComponentRenderer';
import { getMockRouterProps } from '@/services/__mocks__/router';
import { constructWorkspace } from '@/services/workspace-adapter';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

import LoaderContainer from '..';

jest.mock('../../../pages/Loader');

const mockFindTargetWorkspace = jest.fn().mockReturnValue(undefined);
// const mockFindTargetWorkspace = jest.fn();
jest.mock('../../../services/helpers/factoryFlow/findTargetWorkspace', () => ({
  __esModule: true,
  findTargetWorkspace: () => mockFindTargetWorkspace(),
}));

const { renderComponent } = getComponentRenderer(getComponent);

describe('Loader container', () => {
  const factoryUrl = 'factory-url';
  const namespace = 'user-che';
  const workspaceName = 'my-wksp';
  let emptyStore: Store;

  beforeEach(() => {
    // mockFindTargetWorkspace.mockReturnValue(undefined);
    emptyStore = new FakeStoreBuilder().build();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('render the loader page in factory mode', () => {
    const props = getMockRouterProps(ROUTE.FACTORY_LOADER_URL, { url: factoryUrl });

    renderComponent(emptyStore, props);

    expect(screen.getByTestId('loader-page')).toBeInTheDocument();
  });

  test('render the loader page in workspace mode', () => {
    const props = getMockRouterProps(ROUTE.IDE_LOADER, {
      namespace,
      workspaceName,
    });

    renderComponent(emptyStore, props);

    expect(screen.getByTestId('loader-page')).toBeInTheDocument();
  });

  it('should handle tab change', async () => {
    const props = getMockRouterProps(ROUTE.IDE_LOADER, {
      namespace,
      workspaceName,
    });

    renderComponent(emptyStore, props);

    const tab = screen.getByTestId('tab-button');
    userEvent.click(tab);

    await waitFor(() => {
      expect(screen.getByTestId('loader-tab')).toHaveTextContent('Events');
    });
  });

  it('should re-render the loader page when the location changes', async () => {
    const props = getMockRouterProps(ROUTE.FACTORY_LOADER, {
      url: factoryUrl,
    });

    const { reRenderComponent } = renderComponent(emptyStore, props);

    expect(screen.getByTestId('workspace')).toHaveTextContent('unknown');

    const namespace = 'user-che';
    const workspaceName = 'my-wksp';
    const nextDevWorkspace = new DevWorkspaceBuilder()
      .withNamespace(namespace)
      .withName(workspaceName)
      .build();
    const nextStore = new FakeStoreBuilder()
      .withDevWorkspaces({ workspaces: [nextDevWorkspace] })
      .build();

    const nextProps = getMockRouterProps(ROUTE.IDE_LOADER, {
      namespace,
      workspaceName,
    });

    mockFindTargetWorkspace.mockClear();
    mockFindTargetWorkspace.mockReturnValueOnce(constructWorkspace(nextDevWorkspace));

    reRenderComponent(nextStore, nextProps);

    expect(screen.getByTestId('workspace')).toHaveTextContent(workspaceName);
  });
});

function getComponent(store: Store, props: RouteComponentProps): React.ReactElement {
  return (
    <Provider store={store}>
      <LoaderContainer {...props} />
    </Provider>
  );
}
