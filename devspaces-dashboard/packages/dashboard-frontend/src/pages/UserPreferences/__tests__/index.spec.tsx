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

import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider } from 'react-redux';
import { Location } from 'react-router-dom';

import UserPreferences from '@/pages/UserPreferences';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';
import { buildUserPreferencesLocation } from '@/services/helpers/location';
import { UserPreferencesTab } from '@/services/helpers/types';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

jest.mock('../ContainerRegistriesTab');
jest.mock('../GitConfig');
jest.mock('../GitServices');
jest.mock('../PersonalAccessTokens');
jest.mock('../SshKeys');

const { renderComponent } = getComponentRenderer(getComponent);

const mockNavigate = jest.fn();

function getComponent(location: Location): React.ReactElement {
  const store = new FakeStoreBuilder().build();
  return (
    <Provider store={store}>
      <UserPreferences location={location} navigate={mockNavigate} />
    </Provider>
  );
}

describe('UserPreferences', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const location = buildUserPreferencesLocation();
    renderComponent(location);

    expect(document.body).toMatchSnapshot();
  });

  it('should activate the Container Registries tab by default', () => {
    const location = buildUserPreferencesLocation('unknown-tab-name' as UserPreferencesTab);

    renderComponent(location);

    expect(screen.queryByRole('tabpanel', { name: 'Container Registries' })).toBeTruthy();
  });

  describe('Location change', () => {
    it('should activate the Container Registries tab', () => {
      const location = buildUserPreferencesLocation(UserPreferencesTab.CONTAINER_REGISTRIES);
      renderComponent(location);

      expect(screen.queryByRole('tabpanel', { name: 'Container Registries' })).toBeTruthy();
    });

    it('should activate the Git Services tab', () => {
      const location = buildUserPreferencesLocation(UserPreferencesTab.GIT_SERVICES);
      renderComponent(location);

      expect(screen.queryByRole('tabpanel', { name: 'Git Services' })).toBeTruthy();
    });

    it('should activate the Personal Access Tokens tab', () => {
      const location = buildUserPreferencesLocation(UserPreferencesTab.PERSONAL_ACCESS_TOKENS);
      renderComponent(location);

      expect(screen.queryByRole('tabpanel', { name: 'Personal Access Tokens' })).toBeTruthy();
    });

    it('should activate the SSH Keys tab', () => {
      const location = buildUserPreferencesLocation(UserPreferencesTab.SSH_KEYS);
      renderComponent(location);

      expect(screen.queryByRole('tabpanel', { name: 'SSH Keys' })).toBeTruthy();
    });
  });

  describe('Tabs', () => {
    it('should activate the Container Registries tab', async () => {
      const location = buildUserPreferencesLocation(UserPreferencesTab.SSH_KEYS);
      renderComponent(location);

      const tab = screen.getByRole('tab', { name: 'Container Registries' });
      await userEvent.click(tab);

      expect(screen.queryByRole('tabpanel', { name: 'Container Registries' })).toBeTruthy();
    });

    it('should activate the Git Services tab', async () => {
      const location = buildUserPreferencesLocation(UserPreferencesTab.SSH_KEYS);
      renderComponent(location);

      const tab = screen.getByRole('tab', { name: 'Git Services' });
      await userEvent.click(tab);

      expect(screen.queryByRole('tabpanel', { name: 'Git Services' })).toBeTruthy();
    });

    it('should activate the Personal Access Tokens tab', async () => {
      const location = buildUserPreferencesLocation(UserPreferencesTab.SSH_KEYS);
      renderComponent(location);

      const tab = screen.getByRole('tab', { name: 'Personal Access Tokens' });
      await userEvent.click(tab);

      expect(screen.queryByRole('tabpanel', { name: 'Personal Access Tokens' })).toBeTruthy();
    });

    it('should activate the Gitconfig tab', async () => {
      const location = buildUserPreferencesLocation(UserPreferencesTab.SSH_KEYS);
      renderComponent(location);

      const tab = screen.getByRole('tab', { name: 'Gitconfig' });
      await userEvent.click(tab);

      expect(screen.queryByRole('tabpanel', { name: 'Gitconfig' })).toBeTruthy();
    });

    it('should activate the SSH Keys tab', async () => {
      const location = buildUserPreferencesLocation(UserPreferencesTab.CONTAINER_REGISTRIES);
      renderComponent(location);

      const tab = screen.getByRole('tab', { name: 'SSH Keys' });
      await userEvent.click(tab);

      expect(screen.queryByRole('tabpanel', { name: 'SSH Keys' })).toBeTruthy();
    });
  });
});
