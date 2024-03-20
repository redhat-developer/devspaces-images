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

import { api } from '@eclipse-che/common';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider } from 'react-redux';
import { Action, Store } from 'redux';

import { container } from '@/inversify.config';
import GitServices from '@/pages/UserPreferences/GitServices';
import getComponentRenderer, {
  screen,
  waitFor,
  within,
} from '@/services/__mocks__/getComponentRenderer';
import { AppAlerts } from '@/services/alerts/appAlerts';
import { AlertItem } from '@/services/helpers/types';
import { AppThunk } from '@/store';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import * as GitOauthConfigStore from '@/store/GitOauthConfig';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

jest.mock('@/pages/UserPreferences/GitServices/EmptyState');
jest.mock('@/pages/UserPreferences/GitServices/RevokeModal');
jest.mock('@/pages/UserPreferences/GitServices/List');

const mockRequestGitOauthConfig = jest.fn().mockImplementation(() => Promise.resolve());
const mockRequestSkipAuthorizationProviders = jest.fn().mockImplementation(() => Promise.resolve());
const mockRevokeOauth = jest.fn().mockImplementation(() => Promise.resolve());
const mockDeleteSkipOauth = jest.fn().mockImplementation(() => Promise.resolve());
jest.mock('@/store/GitOauthConfig', () => {
  return {
    actionCreators: {
      requestGitOauthConfig: () => async () => mockRequestGitOauthConfig(),
      requestSkipAuthorizationProviders: () => async () => mockRequestSkipAuthorizationProviders(),
      revokeOauth:
        (
          ...args: Parameters<GitOauthConfigStore.ActionCreators['revokeOauth']>
        ): AppThunk<Action, Promise<void>> =>
        async (): Promise<void> =>
          mockRevokeOauth(...args),
      deleteSkipOauth: () => async () => mockDeleteSkipOauth,
    },
  };
});

const mockShowAlert = jest.fn();

describe('GitServices', () => {
  let store: Store;

  beforeEach(() => {
    store = new FakeStoreBuilder()
      .withGitOauthConfig(
        [
          {
            name: 'bitbucket',
            endpointUrl: 'https://bitbucket.org',
          },
          {
            name: 'github',
            endpointUrl: 'https://github.com',
          },
          {
            name: 'github_2',
            endpointUrl: 'https://github_2.com',
          },
          {
            name: 'gitlab',
            endpointUrl: 'https://gitlab.com',
          },
          {
            name: 'azure-devops',
            endpointUrl: 'https://dev.azure.com',
          },
        ],
        ['github', 'gitlab'],
        ['azure-devops'],
      )
      .build();

    class MockAppAlerts extends AppAlerts {
      showAlert(alert: AlertItem): void {
        mockShowAlert(alert);
      }
    }

    container.snapshot();
    container.rebind(AppAlerts).to(MockAppAlerts).inSingletonScope();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const snapshot = createSnapshot(store);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('empty state text', () => {
    const emptyStore = new FakeStoreBuilder().build();
    renderComponent(emptyStore);

    const emptyStateText = screen.queryByText('No Git Services');
    expect(emptyStateText).toBeTruthy();
  });

  test('initial state', () => {
    renderComponent(store);

    // number of git services
    expect(screen.getByTestId('number-of-git-services')).toHaveTextContent('5');

    // providers with token
    expect(screen.getByTestId('providers-with-token')).toHaveTextContent('github,gitlab');

    // providers declined
    expect(screen.getByTestId('skip-oauth-providers')).toHaveTextContent('azure-devops');

    // modal is closed
    expect(screen.getByTestId('revoke-modal-is-open')).toHaveTextContent('closed');
  });

  it('should show alert warning when requestGitOauthConfig fails', async () => {
    const errorMessage = 'failure reason';
    mockRequestGitOauthConfig.mockRejectedValueOnce(new Error(errorMessage));

    renderComponent(store);

    await waitFor(() =>
      expect(mockShowAlert).toHaveBeenCalledWith({
        key: 'request-git-services-failed',
        title: errorMessage,
        variant: 'danger',
      }),
    );
  });

  test('open modal and cancel', () => {
    renderComponent(store);

    // click on revoke button in the list
    const list = screen.getByTestId('git-services-list');
    const revokeButton = within(list).getByRole('button', { name: 'Revoke' });
    userEvent.click(revokeButton);

    // modal is open
    expect(screen.getByTestId('revoke-modal-is-open')).toHaveTextContent('open');

    // click on cancel button on the modal
    const modal = screen.getByTestId('git-services-revoke-modal');
    const cancelButton = within(modal).getByRole('button', { name: 'Cancel' });

    userEvent.click(cancelButton);

    // modal is closed
    expect(screen.getByTestId('revoke-modal-is-open')).toHaveTextContent('closed');
  });

  test('open modal and confirm', async () => {
    // tune mocked store
    // to test the case when revoke action fails
    const errorMessage = 'failure reason for github_2';
    mockRevokeOauth.mockImplementation((provider: api.GitOauthProvider) => {
      if (provider === 'github_2') {
        return Promise.reject(new Error(errorMessage));
      }
      return Promise.resolve();
    });

    renderComponent(store);

    // click on revoke button in the list
    const list = screen.getByTestId('git-services-list');
    const revokeButton = within(list).getByRole('button', { name: 'Revoke' });
    userEvent.click(revokeButton);

    // modal is open
    expect(screen.getByTestId('revoke-modal-is-open')).toHaveTextContent('open');

    // confirm revoke
    const modal = screen.getByTestId('git-services-revoke-modal');
    const revokeButtonOnModal = within(modal).getByRole('button', { name: 'Revoke' });

    userEvent.click(revokeButtonOnModal);

    // modal is closed
    expect(screen.getByTestId('revoke-modal-is-open')).toHaveTextContent('closed');

    // revoke action is called
    await waitFor(() => expect(mockRevokeOauth).toHaveBeenCalledTimes(5));

    // success alerts are shown
    expect(mockShowAlert).toHaveBeenNthCalledWith(1, {
      key: 'revoke-bitbucket',
      title: 'Git OAuth "bitbucket" has been revoked',
      variant: 'success',
    });
    expect(mockShowAlert).toHaveBeenNthCalledWith(2, {
      key: 'revoke-github',
      title: 'Git OAuth "github" has been revoked',
      variant: 'success',
    });
    expect(mockShowAlert).toHaveBeenNthCalledWith(4, {
      key: 'revoke-gitlab',
      title: 'Git OAuth "gitlab" has been revoked',
      variant: 'success',
    });
    expect(mockShowAlert).toHaveBeenNthCalledWith(5, {
      key: 'revoke-azure-devops',
      title: 'Git OAuth "azure-devops" has been revoked',
      variant: 'success',
    });

    // error alert is shown
    expect(mockShowAlert).toHaveBeenNthCalledWith(3, {
      key: 'revoke-github_2',
      title: errorMessage,
      variant: 'danger',
    });
  });
});

function getComponent(store: Store) {
  return (
    <Provider store={store}>
      <GitServices />
    </Provider>
  );
}
