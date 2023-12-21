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
import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { FakeGitOauthBuilder } from '@/pages/UserPreferences/GitServicesTab/__tests__/__mocks__/gitOauthRowBuilder';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { actionCreators } from '@/store/GitOauthConfig';
import {
  selectGitOauth,
  selectIsLoading,
  selectProvidersWithToken,
  selectSkipOauthProviders,
} from '@/store/GitOauthConfig/selectors';

import { GitServices } from '..';

// mute the outputs
console.error = jest.fn();

describe('GitServices', () => {
  const mockRevokeOauth = jest.fn();
  const requestGitOauthConfig = jest.fn();
  const requestSkipAuthorizationProviders = jest.fn();
  const deleteSkipOauth = jest.fn();

  const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

  function getComponent(store: Store): React.ReactElement {
    const state = store.getState();
    const gitOauth = selectGitOauth(state);
    const isLoading = selectIsLoading(state);
    const providersWithToken = selectProvidersWithToken(state);
    const skipOauthProviders = selectSkipOauthProviders(state);
    return (
      <Provider store={store}>
        <GitServices
          gitOauth={gitOauth}
          isLoading={isLoading}
          revokeOauth={mockRevokeOauth}
          deleteSkipOauth={deleteSkipOauth}
          requestGitOauthConfig={requestGitOauthConfig}
          requestSkipAuthorizationProviders={requestSkipAuthorizationProviders}
          providersWithToken={providersWithToken}
          skipOauthProviders={skipOauthProviders}
        />
      </Provider>
    );
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('without git services', () => {
    let store: Store;

    beforeEach(() => {
      store = new FakeStoreBuilder().build();
    });

    test('snapshot', () => {
      const snapshot = createSnapshot(store);

      expect(snapshot.toJSON()).toMatchSnapshot();
    });

    test('empty state text', () => {
      renderComponent(store);

      const emptyStateText = screen.queryByText('No Git Services');
      expect(emptyStateText).toBeTruthy();
    });
  });

  describe('with 4 git services', () => {
    let store: Store;

    beforeEach(() => {
      store = new FakeStoreBuilder()
        .withGitOauthConfig(
          [
            new FakeGitOauthBuilder()
              .withName('github')
              .withEndpointUrl('https://github.dummy.endpoint.com')
              .build(),
            new FakeGitOauthBuilder()
              .withName('gitlab')
              .withEndpointUrl('https://gitlab.dummy.endpoint.com')
              .build(),
            new FakeGitOauthBuilder()
              .withName('bitbucket')
              .withEndpointUrl('https://bitbucket.dummy.endpoint.org')
              .build(),
            new FakeGitOauthBuilder()
              .withName('bitbucket-server')
              .withEndpointUrl('https://bitbucket-server.dummy.endpoint.org')
              .build(),
            new FakeGitOauthBuilder()
              .withName('azure-devops')
              .withEndpointUrl('https://azure.dummy.endpoint.com/')
              .build(),
          ],
          ['github'],
          [],
        )
        .build();
    });

    test('providers actions depending on authorization state', () => {
      renderComponent(store);

      const emptyStateText = screen.queryByText('No Git Services');
      expect(emptyStateText).not.toBeTruthy();

      const actions = screen.queryAllByRole('button', { name: /actions/i });

      expect(actions.length).toEqual(5);
      expect(actions[0]).not.toBeDisabled();
      expect(actions[1]).toBeDisabled();
      expect(actions[2]).toBeDisabled();
      expect(actions[3]).toBeDisabled();
      expect(actions[4]).toBeDisabled();
    });

    test('snapshot', () => {
      const snapshot = createSnapshot(store);

      expect(snapshot.toJSON()).toMatchSnapshot();
    });
  });

  it('should revoke a git service', () => {
    const spyRevokeOauth = jest.spyOn(actionCreators, 'revokeOauth');
    const store = new FakeStoreBuilder()
      .withGitOauthConfig(
        [
          new FakeGitOauthBuilder()
            .withName('github')
            .withEndpointUrl('https://github.com')
            .build(),
        ],
        ['github'],
        [],
      )
      .build();
    renderComponent(store);

    const menuButton = screen.getByLabelText('Actions');
    expect(menuButton).not.toBeDisabled();
    userEvent.click(menuButton);

    const revokeItem = screen.getByRole('menuitem', { name: /Revoke/i });
    userEvent.click(revokeItem);

    const text = screen.findByText("Would you like to revoke git service 'GitHub'?");
    expect(text).toBeTruthy();

    const revokeButton = screen.getByTestId('revoke-button');
    expect(revokeButton).toBeDisabled();

    const checkbox = screen.getByTestId('warning-info-checkbox');
    userEvent.click(checkbox);
    expect(revokeButton).toBeEnabled();

    userEvent.click(revokeButton);
    expect(spyRevokeOauth).toHaveBeenLastCalledWith('github');
  });
});
