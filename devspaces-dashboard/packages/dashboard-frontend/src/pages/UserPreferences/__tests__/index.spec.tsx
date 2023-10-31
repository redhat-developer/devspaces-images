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

import userEvent from '@testing-library/user-event';
import { createHashHistory, History } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { Router } from 'react-router';

import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

import UserPreferences from '..';

jest.mock('../ContainerRegistriesTab');
jest.mock('../GitConfig');
jest.mock('../GitServicesTab');
jest.mock('../PersonalAccessTokens');
jest.mock('../SshKeys');

const { renderComponent } = getComponentRenderer(getComponent);

let history: History;
function getComponent(): React.ReactElement {
  const store = new FakeStoreBuilder().build();
  return (
    <Router history={history}>
      <Provider store={store}>
        <UserPreferences history={history} />
      </Provider>
    </Router>
  );
}

describe('UserPreferences', () => {
  beforeEach(() => {
    history = createHashHistory();
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.location.href = '/';
  });

  // TODO: figure out why screenshots fail on the `Tabs` component
  // test('snapshot', () => {
  //   const snapshot = createSnapshot();
  //   expect(snapshot.toJSON()).toMatchSnapshot();
  // });

  it('should activate the Container Registries tab by default', () => {
    history.push('/user-preferences?tab=unknown-tab-name');

    renderComponent();

    expect(screen.queryByRole('tabpanel', { name: 'Container Registries' })).toBeTruthy();
  });

  describe('Location change', () => {
    it('should activate the Container Registries tab', () => {
      history.push('/user-preferences?tab=container-registries');

      renderComponent();

      expect(screen.queryByRole('tabpanel', { name: 'Container Registries' })).toBeTruthy();
    });

    it('should activate the Git Services tab', () => {
      history.push('/user-preferences?tab=git-services');

      renderComponent();

      expect(screen.queryByRole('tabpanel', { name: 'Git Services' })).toBeTruthy();
    });

    it('should activate the Personal Access Tokens tab', () => {
      history.push('/user-preferences?tab=personal-access-tokens');

      renderComponent();

      expect(screen.queryByRole('tabpanel', { name: 'Personal Access Tokens' })).toBeTruthy();
    });

    it('should activate the SSH Keys tab', () => {
      history.push('/user-preferences?tab=ssh-keys');

      renderComponent();

      expect(screen.queryByRole('tabpanel', { name: 'SSH Keys' })).toBeTruthy();
    });
  });

  describe('Tabs', () => {
    it('should activate the Container Registries tab', () => {
      renderComponent();

      const tab = screen.getByRole('tab', { name: 'Container Registries' });
      userEvent.click(tab);

      expect(screen.queryByRole('tabpanel', { name: 'Container Registries' })).toBeTruthy();
    });

    it('should activate the Git Services tab', () => {
      renderComponent();

      const tab = screen.getByRole('tab', { name: 'Git Services' });
      userEvent.click(tab);

      expect(screen.queryByRole('tabpanel', { name: 'Git Services' })).toBeTruthy();
    });

    it('should activate the Personal Access Tokens tab', () => {
      renderComponent();

      const tab = screen.getByRole('tab', { name: 'Personal Access Tokens' });
      userEvent.click(tab);

      expect(screen.queryByRole('tabpanel', { name: 'Personal Access Tokens' })).toBeTruthy();
    });

    it('should activate the Gitconfig tab', () => {
      renderComponent();

      const tab = screen.getByRole('tab', { name: 'Gitconfig' });
      userEvent.click(tab);

      expect(screen.queryByRole('tabpanel', { name: 'Gitconfig' })).toBeTruthy();
    });

    it('should activate the SSH Keys tab', () => {
      renderComponent();

      const tab = screen.getByRole('tab', { name: 'SSH Keys' });
      userEvent.click(tab);

      expect(screen.queryByRole('tabpanel', { name: 'SSH Keys' })).toBeTruthy();
    });
  });
});
