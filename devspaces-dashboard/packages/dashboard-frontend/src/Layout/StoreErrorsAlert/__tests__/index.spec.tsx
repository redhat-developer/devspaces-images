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
import { Store } from 'redux';
import { Provider } from 'react-redux';
import { render, RenderResult, screen } from '@testing-library/react';
import StoreErrorsAlert from '..';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';
import AppAlertGroup from '../../../components/AppAlertGroup';
import { container } from '../../../inversify.config';

describe('StoreErrorAlert component', () => {
  beforeEach(() => {
    container.snapshot();
  });

  afterEach(() => {
    container.restore();
  });

  it('should not show any alerts', () => {
    const store = new FakeStoreBuilder().build();
    renderComponent(store);

    const alertHeading = screen.queryByRole('heading', { name: /danger alert/i });
    expect(alertHeading).toBeFalsy();
  });

  it('should show other preload alerts when sanity check passes', () => {
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({}, false, 'expected error 1')
      .withDevfileRegistries({
        registries: {
          'registry-location': {
            error: 'expected error 2',
          },
        },
      })
      .withInfrastructureNamespace([], false, 'expected error 3')
      .withPlugins([], false, 'expected error 4')
      .withSanityCheck({
        // sanity check passes
        error: undefined,
      })
      .withUserProfile(
        {
          email: 'user1@che',
          username: 'user1',
        },
        'expected error 6',
      )
      .withWorkspacesSettings({} as che.WorkspaceSettings, false, 'expected error 7')
      .build();
    renderComponent(store);

    const cheWorkspacesAlert = screen.queryByRole('heading', { name: /expected error 1/i });
    expect(cheWorkspacesAlert).toBeTruthy();

    const devfileRegistryAlert = screen.queryByRole('heading', { name: /expected error 2/i });
    expect(devfileRegistryAlert).toBeTruthy();

    const infrastructureNamespacesAlert = screen.queryByRole('heading', {
      name: /expected error 3/i,
    });
    expect(infrastructureNamespacesAlert).toBeTruthy();

    const pluginsAlert = screen.queryByRole('heading', { name: /expected error 4/i });
    expect(pluginsAlert).toBeTruthy();

    // no such errors should be shown
    const sanityCheckAlert = screen.queryByRole('heading', {
      name: /expected error 5/i,
    });
    expect(sanityCheckAlert).toBeFalsy();

    const userProfileAlert = screen.queryByRole('heading', { name: /expected error 6/i });
    expect(userProfileAlert).toBeTruthy();

    const workspacesSettingsAlert = screen.queryByRole('heading', { name: /expected error 7/i });
    expect(workspacesSettingsAlert).toBeTruthy();
  });

  it('should show sanity check error and hide other errors', () => {
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({}, false, 'expected error 1')
      .withDevfileRegistries({
        registries: {
          'registry-location': {
            error: 'expected error 2',
          },
        },
      })
      .withInfrastructureNamespace([], false, 'expected error 3')
      .withPlugins([], false, 'expected error 4')
      .withSanityCheck({
        // sanity check fails
        error: 'expected error 5',
      })
      .withUserProfile(
        {
          email: 'user1@che',
          username: 'user1',
        },
        'expected error 6',
      )
      .withWorkspacesSettings({} as che.WorkspaceSettings, false, 'expected error 7')
      .build();
    renderComponent(store);

    const cheWorkspacesAlert = screen.queryByRole('heading', { name: /expected error 1/i });
    expect(cheWorkspacesAlert).toBeFalsy();

    const devfileRegistryAlert = screen.queryByRole('heading', { name: /expected error 2/i });
    expect(devfileRegistryAlert).toBeFalsy();

    const infrastructureNamespacesAlert = screen.queryByRole('heading', {
      name: /expected error 3/i,
    });
    expect(infrastructureNamespacesAlert).toBeFalsy();

    const pluginsAlert = screen.queryByRole('heading', { name: /expected error 4/i });
    expect(pluginsAlert).toBeFalsy();

    // only this alert should be shown
    const sanityCheckAlert = screen.queryByRole('heading', {
      name: /expected error 5/i,
    });
    expect(sanityCheckAlert).toBeTruthy();

    const userProfileAlert = screen.queryByRole('heading', { name: /expected error 6/i });
    expect(userProfileAlert).toBeFalsy();

    const workspacesSettingsAlert = screen.queryByRole('heading', { name: /expected error 7/i });
    expect(workspacesSettingsAlert).toBeFalsy();
  });

  it('should show sanity check error after bootstrap', () => {
    const store = new FakeStoreBuilder().build();
    const { rerender } = renderComponent(store);

    // no alerts at this point
    const alertHeading = screen.queryByRole('heading', { name: /danger alert/i });
    expect(alertHeading).toBeFalsy();

    const nextStore = new FakeStoreBuilder()
      .withSanityCheck({
        error: 'expected error',
      })
      .build();
    rerender(
      <Provider store={nextStore}>
        <AppAlertGroup />
        <StoreErrorsAlert />
      </Provider>,
    );

    const nextAlertHeading = screen.queryByRole('heading', { name: /danger alert/i });
    expect(nextAlertHeading).toBeTruthy();
    expect(nextAlertHeading).toHaveTextContent('expected error');
  });
});

function renderComponent(store: Store): RenderResult {
  return render(
    <Provider store={store}>
      <AppAlertGroup />
      <StoreErrorsAlert />
    </Provider>,
  );
}
