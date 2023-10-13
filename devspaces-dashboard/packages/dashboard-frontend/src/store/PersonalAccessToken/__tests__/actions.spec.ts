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

import * as KubernetesNamespaceApi from '@/services/backend-client/kubernetesNamespaceApi';
import * as PersonalAccessTokenApi from '@/services/backend-client/personalAccessTokenApi';
import { AppState } from '@/store';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { token1, token2 } from '@/store/PersonalAccessToken/__tests__/stub';
import { AUTHORIZED } from '@/store/sanityCheckMiddleware';

import * as testStore from '..';

jest.mock(
  '../../../services/backend-client/kubernetesNamespaceApi',
  () =>
    ({
      provisionKubernetesNamespace: () => Promise.resolve({} as che.KubernetesNamespace),
    }) as typeof KubernetesNamespaceApi,
);

const mockFetchTokens = jest.fn();
const mockAddToken = jest.fn();
const mockUpdateToken = jest.fn();
const mockRemoveToken = jest.fn();
jest.mock(
  '../../../services/backend-client/personalAccessTokenApi',
  () =>
    ({
      fetchTokens: (...args) => mockFetchTokens(...args),
      addToken: (...args) => mockAddToken(...args),
      updateToken: (...args) => mockUpdateToken(...args),
      removeToken: (...args) => mockRemoveToken(...args),
    }) as typeof PersonalAccessTokenApi,
);

// mute the outputs
console.error = jest.fn();

describe('Personal Access Token store, actions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create REQUEST_TOKENS and RECEIVE_TOKENS when requesting tokens', async () => {
    mockFetchTokens.mockResolvedValueOnce([token1, token2]);

    const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, testStore.KnownAction>
    >;

    await store.dispatch(testStore.actionCreators.requestTokens());

    const actions = store.getActions();
    const expectedActions: testStore.KnownAction[] = [
      {
        type: testStore.Type.REQUEST_TOKENS,
        check: AUTHORIZED,
      },
      {
        type: testStore.Type.RECEIVE_TOKENS,
        tokens: [token1, token2],
      },
    ];
    expect(actions).toEqual(expectedActions);
  });

  it('should create REQUEST_TOKENS and RECEIVE_ERROR when requesting tokens', async () => {
    const errorMessage = 'Something bad happened';
    mockFetchTokens.mockRejectedValueOnce(new Error(errorMessage));

    const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, testStore.KnownAction>
    >;

    try {
      await store.dispatch(testStore.actionCreators.requestTokens());
    } catch (e) {
      // no-op
    }

    const actions = store.getActions();
    const expectedActions: testStore.KnownAction[] = [
      {
        type: testStore.Type.REQUEST_TOKENS,
        check: AUTHORIZED,
      },
      {
        type: testStore.Type.RECEIVE_ERROR,
        error: errorMessage,
      },
    ];
    expect(actions).toEqual(expectedActions);
  });

  it('should create REQUEST_TOKENS and ADD_TOKEN when adding token', async () => {
    mockAddToken.mockResolvedValueOnce(token1);
    mockFetchTokens.mockResolvedValueOnce([token1]);

    const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, testStore.KnownAction>
    >;

    await store.dispatch(testStore.actionCreators.addToken(token1));

    const actions = store.getActions();
    const expectedActions: testStore.KnownAction[] = [
      {
        type: testStore.Type.REQUEST_TOKENS,
        check: AUTHORIZED,
      },
      {
        type: testStore.Type.ADD_TOKEN,
        token: token1,
      },
    ];
    expect(actions).toEqual(expectedActions);
  });

  it('should create REQUEST_TOKENS and RECEIVE_ERROR when adding token', async () => {
    const errorMessage = 'Something bad happened';
    mockAddToken.mockRejectedValueOnce(new Error(errorMessage));

    const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, testStore.KnownAction>
    >;

    try {
      await store.dispatch(testStore.actionCreators.addToken(token1));
    } catch (e) {
      // no-op
    }

    const actions = store.getActions();
    const expectedActions: testStore.KnownAction[] = [
      {
        type: testStore.Type.REQUEST_TOKENS,
        check: AUTHORIZED,
      },
      {
        type: testStore.Type.RECEIVE_ERROR,
        error: errorMessage,
      },
    ];
    expect(actions).toEqual(expectedActions);
  });

  it('should create REQUEST_TOKENS and RECEIVE_ERROR when adding a non valid token', async () => {
    // the non valid token was added successfully
    mockAddToken.mockResolvedValueOnce(token1);
    // but it was missing among the tokens returned by the backend
    mockFetchTokens.mockResolvedValueOnce([]);

    const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, testStore.KnownAction>
    >;

    try {
      await store.dispatch(testStore.actionCreators.addToken(token1));
    } catch (e) {
      // no-op
    }

    const actions = store.getActions();
    const expectedActions: testStore.KnownAction[] = [
      {
        type: testStore.Type.REQUEST_TOKENS,
        check: AUTHORIZED,
      },
      {
        type: testStore.Type.RECEIVE_ERROR,
        error: `Token "${token1.tokenName}" was not added because it is not valid.`,
      },
    ];
    expect(actions).toEqual(expectedActions);
  });

  it('should create REQUEST_TOKENS and UPDATE_TOKEN when updating token', async () => {
    mockUpdateToken.mockResolvedValueOnce(token1);

    const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, testStore.KnownAction>
    >;

    await store.dispatch(testStore.actionCreators.updateToken(token1));

    const actions = store.getActions();
    const expectedActions: testStore.KnownAction[] = [
      {
        type: testStore.Type.REQUEST_TOKENS,
        check: AUTHORIZED,
      },
      {
        type: testStore.Type.UPDATE_TOKEN,
        token: token1,
      },
    ];
    expect(actions).toEqual(expectedActions);
  });

  it('should create REQUEST_TOKENS and RECEIVE_ERROR when updating token', async () => {
    const errorMessage = 'Something bad happened';
    mockUpdateToken.mockRejectedValueOnce(new Error(errorMessage));

    const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, testStore.KnownAction>
    >;

    try {
      await store.dispatch(testStore.actionCreators.updateToken(token1));
    } catch (e) {
      // no-op
    }

    const actions = store.getActions();
    const expectedActions: testStore.KnownAction[] = [
      {
        type: testStore.Type.REQUEST_TOKENS,
        check: AUTHORIZED,
      },
      {
        type: testStore.Type.RECEIVE_ERROR,
        error: errorMessage,
      },
    ];
    expect(actions).toEqual(expectedActions);
  });

  it('should create REQUEST_TOKENS and REMOVE_TOKEN when deleting token', async () => {
    mockRemoveToken.mockResolvedValueOnce(token1);

    const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, testStore.KnownAction>
    >;

    await store.dispatch(testStore.actionCreators.removeToken(token1));

    const actions = store.getActions();
    const expectedActions: testStore.KnownAction[] = [
      {
        type: testStore.Type.REQUEST_TOKENS,
        check: AUTHORIZED,
      },
      {
        type: testStore.Type.REMOVE_TOKEN,
        token: token1,
      },
    ];
    expect(actions).toEqual(expectedActions);
  });

  it('should create REQUEST_TOKENS and RECEIVE_ERROR when deleting token', async () => {
    const errorMessage = 'Something bad happened';
    mockRemoveToken.mockRejectedValueOnce(new Error(errorMessage));

    const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, testStore.KnownAction>
    >;

    try {
      await store.dispatch(testStore.actionCreators.removeToken(token1));
    } catch (e) {
      // no-op
    }

    const actions = store.getActions();
    const expectedActions: testStore.KnownAction[] = [
      {
        type: testStore.Type.REQUEST_TOKENS,
        check: AUTHORIZED,
      },
      {
        type: testStore.Type.RECEIVE_ERROR,
        error: errorMessage,
      },
    ];
    expect(actions).toEqual(expectedActions);
  });
});
