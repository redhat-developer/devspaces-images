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
import { Store } from 'redux';
import { Provider } from 'react-redux';
import { render, RenderResult, screen } from '@testing-library/react';
import PreloadIssuesAlert from '..';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';
import AppAlertGroup from '../../../components/AppAlertGroup';

describe('PreloadIssuesAlert component', () => {
  it('should not show any alerts', () => {
    const store = new FakeStoreBuilder().build();
    renderComponent(store);

    const alertHeading = screen.queryByRole('heading', { name: /danger alert/i });
    expect(alertHeading).toBeFalsy();
  });

  it('should show preload alerts', () => {
    const store = new FakeStoreBuilder()
      .withCheWorkspaces({}, false, 'expected error 1')
      .withDevfileRegistries({
        registries: {
          'registry-location': {
            error: 'expected error 2',
          },
        },
      })
      .withInfrastructureNamespace([], false, 'expected error 3')
      .withPlugins([], false, 'expected error 4')
      .withUser({} as che.User, 'expected error 5')
      .withUserProfile({}, 'expected error 6')
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

    const userInfoAlert = screen.queryByRole('heading', { name: /expected error 5/i });
    expect(userInfoAlert).toBeTruthy();

    const userProfileAlert = screen.queryByRole('heading', { name: /expected error 6/i });
    expect(userProfileAlert).toBeTruthy();

    const workspacesSettingsAlert = screen.queryByRole('heading', { name: /expected error 7/i });
    expect(workspacesSettingsAlert).toBeTruthy();
  });
});

function renderComponent(store: Store): RenderResult {
  return render(
    <Provider store={store}>
      <AppAlertGroup />
      <PreloadIssuesAlert />
    </Provider>,
  );
}
