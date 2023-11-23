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

import { MockStoreEnhanced } from 'redux-mock-store';
import { ThunkDispatch } from 'redux-thunk';

import { AppState } from '@/store';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { IGitOauth } from '@/store/GitOauthConfig/types';

import * as TestStore from '..';

const gitOauth = [
  {
    name: 'github',
    endpointUrl: 'https://github.com',
  },
  {
    name: 'gitlab',
    endpointUrl: 'https://gitlab.com',
  },
  {
    name: 'azure-devops',
    endpointUrl: 'https://dev.azure.com',
  },
] as IGitOauth[];

const mockGetOAuthProviders = jest.fn().mockResolvedValue(gitOauth);
const mockGetDevWorkspacePreferences = jest.fn().mockResolvedValue({});
const mockGetOAuthToken = jest.fn().mockImplementation(provider => {
  if (provider === 'github') {
    return new Promise(resolve => resolve('github-token'));
  }
  return new Promise((_resolve, reject) => reject(new Error('Token not found')));
});
const mockFetchTokens = jest.fn().mockResolvedValue([
  {
    tokenName: 'github-personal-access-token',
    gitProvider: 'oauth2-token',
    gitProviderEndpoint: 'https://dev.azure.com/',
  },
] as any[]);

jest.mock('../../../services/backend-client/oAuthApi', () => {
  return {
    getOAuthProviders: (...args: unknown[]) => mockGetOAuthProviders(...args),
    getOAuthToken: (...args: unknown[]) => mockGetOAuthToken(...args),
    getDevWorkspacePreferences: (...args: unknown[]) => mockGetDevWorkspacePreferences(...args),
  };
});
jest.mock('../../../services/backend-client/personalAccessTokenApi', () => {
  return {
    fetchTokens: (...args: unknown[]) => mockFetchTokens(...args),
  };
});

// mute the outputs
console.error = jest.fn();

describe('GitOauthConfig store, actions', () => {
  let store: MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, TestStore.KnownAction>>;

  beforeEach(() => {
    store = new FakeStoreBuilder()
      .withInfrastructureNamespace([{ name: 'user-che', attributes: { phase: 'Active' } }])
      .build();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should request GitOauthConfig', async () => {
    await store.dispatch(TestStore.actionCreators.requestGitOauthConfig());

    const actions = store.getActions();

    const expectedAction: TestStore.KnownAction = {
      supportedGitOauth: gitOauth,
      providersWithToken: ['github', 'azure-devops'],
      type: TestStore.Type.RECEIVE_GIT_OAUTH_PROVIDERS,
    };

    expect(actions).toContainEqual(expectedAction);
  });
});
