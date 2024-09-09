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

import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { container } from '@/inversify.config';
import Layout from '@/Layout';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';
import { BrandingData } from '@/services/bootstrap/branding.constant';
import { IssuesReporterService } from '@/services/bootstrap/issuesReporter';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import * as SanityCheckStore from '@/store/SanityCheck';

const issuesReporterService = container.get(IssuesReporterService);

jest.mock('@/Layout/ErrorBoundary');
jest.mock('@/Layout/Header');
jest.mock('@/Layout/Sidebar');
jest.mock('@/Layout/StoreErrorsAlert');
jest.mock('@/components/BannerAlert');
jest.mock('@/contexts/ToggleBars');

const mockLogout = jest.fn().mockResolvedValue(undefined);
jest.mock('@/services/helpers/login.ts', () => ({
  signOut: () => mockLogout(),
}));

const mockTestBackends = jest.fn();
jest.mock('@/store/SanityCheck/index', () => ({
  ...jest.requireActual('@/store/SanityCheck/index'),
  actionCreators: {
    testBackends: () => async () => mockTestBackends(),
  } as SanityCheckStore.ActionCreators,
}));

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

describe('Layout component', () => {
  let store: Store;

  beforeEach(() => {
    store = new FakeStoreBuilder()
      .withBranding({
        logoFile: 'logo-File',
      } as BrandingData)
      .build();
  });

  afterEach(() => {
    issuesReporterService.clearIssues();
    jest.clearAllMocks();
  });

  test('snapshot of the namespace provisioning error page', () => {
    issuesReporterService.registerIssue(
      'namespaceProvisioningError',
      new Error('Namespace provisioning error'),
    );
    const snapshot = createSnapshot(store);
    expect(snapshot).toMatchSnapshot();
  });

  test('snapshot of the default page', () => {
    const snapshot = createSnapshot(store);
    expect(snapshot).toMatchSnapshot();
  });

  test('logout', async () => {
    renderComponent(store);
    const logoutButton = screen.getByRole('button', { name: 'logout' });
    await userEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  test('toggleNav', async () => {
    renderComponent(store);

    expect(screen.getByTestId('isNavOpen')).toHaveTextContent('true');

    const toggleNavButton = screen.getByRole('button', { name: 'toggleNav' });
    await userEvent.click(toggleNavButton);

    expect(screen.getByTestId('isNavOpen')).toHaveTextContent('false');
  });

  test('onError', async () => {
    mockTestBackends.mockResolvedValue(undefined);

    renderComponent(store);

    const btn = screen.getByRole('button', { name: 'onError' });
    await userEvent.click(btn);

    expect(mockTestBackends).toHaveBeenCalled();
  });

  test('onNamespaceProvisioningError', async () => {
    const errorMessage = 'Namespace provisioning error';
    issuesReporterService.registerIssue('namespaceProvisioningError', new Error(errorMessage));

    renderComponent(store);

    const errorMessageContainer = await waitFor(() => screen.queryByText(errorMessage));

    expect(errorMessageContainer).not.toBeNull();
  });
});

function getComponent(store: Store) {
  const history = createMemoryHistory();
  return (
    <Provider store={store}>
      <Layout history={history}>
        <div>Test</div>
      </Layout>
    </Provider>
  );
}
