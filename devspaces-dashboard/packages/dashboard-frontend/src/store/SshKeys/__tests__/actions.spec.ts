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
import * as sshKeysApi from '@/services/backend-client/sshKeysApi';
import { AppState } from '@/store';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { AUTHORIZED } from '@/store/sanityCheckMiddleware';
import { key1, key2, newKey } from '@/store/SshKeys/__tests__/stub';

import * as testStore from '..';

jest.mock(
  '@/services/backend-client/kubernetesNamespaceApi',
  () =>
    ({
      provisionKubernetesNamespace: () => Promise.resolve({} as che.KubernetesNamespace),
    }) as typeof KubernetesNamespaceApi,
);

const mockFetchSshKeys = jest.fn();
const mockAddSshKey = jest.fn();
const mockRemoveSshKey = jest.fn();
jest.mock(
  '@/services/backend-client/sshKeysApi',
  () =>
    ({
      fetchSshKeys: (...args) => mockFetchSshKeys(...args),
      addSshKey: (...args) => mockAddSshKey(...args),
      removeSshKey: (...args) => mockRemoveSshKey(...args),
    }) as typeof sshKeysApi,
);

// mute the outputs
console.error = jest.fn();

describe('SSH keys, actions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create REQUEST_KEYS and RECEIVE_KEYS when requesting SSH keys', async () => {
    mockFetchSshKeys.mockResolvedValueOnce([key1, key2]);

    const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, testStore.KnownAction>
    >;

    await store.dispatch(testStore.actionCreators.requestSshKeys());

    const actions = store.getActions();
    const expectedActions: testStore.KnownAction[] = [
      {
        type: testStore.Type.REQUEST_KEYS,
        check: AUTHORIZED,
      },
      {
        type: testStore.Type.RECEIVE_KEYS,
        keys: [key1, key2],
      },
    ];
    expect(actions).toEqual(expectedActions);
  });

  it('should create REQUEST_KEYS and RECEIVE_ERROR when requesting SSH keys', async () => {
    const errorMessage = 'Something bad happened';
    mockFetchSshKeys.mockRejectedValueOnce(new Error(errorMessage));

    const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, testStore.KnownAction>
    >;

    try {
      await store.dispatch(testStore.actionCreators.requestSshKeys());
    } catch (e) {
      // no-op
    }

    const actions = store.getActions();
    const expectedActions: testStore.KnownAction[] = [
      {
        type: testStore.Type.REQUEST_KEYS,
        check: AUTHORIZED,
      },
      {
        type: testStore.Type.RECEIVE_ERROR,
        error: errorMessage,
      },
    ];
    expect(actions).toEqual(expectedActions);
  });

  it('should create REQUEST_KEYS and ADD_KEY when adding SSH keys', async () => {
    mockAddSshKey.mockResolvedValueOnce(key1);
    mockFetchSshKeys.mockResolvedValueOnce([key1]);

    const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, testStore.KnownAction>
    >;

    await store.dispatch(testStore.actionCreators.addSshKey(newKey));

    const actions = store.getActions();
    const expectedActions: testStore.KnownAction[] = [
      {
        type: testStore.Type.REQUEST_KEYS,
        check: AUTHORIZED,
      },
      {
        type: testStore.Type.ADD_KEY,
        key: key1,
      },
    ];
    expect(actions).toEqual(expectedActions);
  });

  it('should create REQUEST_KEYS and RECEIVE_ERROR when adding SSH keys', async () => {
    const errorMessage = 'Something bad happened';
    mockAddSshKey.mockRejectedValueOnce(new Error(errorMessage));

    const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, testStore.KnownAction>
    >;

    try {
      await store.dispatch(testStore.actionCreators.addSshKey(newKey));
    } catch (e) {
      // no-op
    }

    const actions = store.getActions();
    const expectedActions: testStore.KnownAction[] = [
      {
        type: testStore.Type.REQUEST_KEYS,
        check: AUTHORIZED,
      },
      {
        type: testStore.Type.RECEIVE_ERROR,
        error: errorMessage,
      },
    ];
    expect(actions).toEqual(expectedActions);
  });

  it('should create REQUEST_KEYS and REMOVE_KEY when deleting SSH key', async () => {
    mockRemoveSshKey.mockResolvedValueOnce(key1);

    const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, testStore.KnownAction>
    >;

    await store.dispatch(testStore.actionCreators.removeSshKey(key1));

    const actions = store.getActions();
    const expectedActions: testStore.KnownAction[] = [
      {
        type: testStore.Type.REQUEST_KEYS,
        check: AUTHORIZED,
      },
      {
        type: testStore.Type.REMOVE_KEY,
        key: key1,
      },
    ];
    expect(actions).toEqual(expectedActions);
  });

  it('should create REQUEST_KEYS and RECEIVE_ERROR when deleting SSH key', async () => {
    const errorMessage = 'Something bad happened';
    mockRemoveSshKey.mockRejectedValueOnce(new Error(errorMessage));

    const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, testStore.KnownAction>
    >;

    try {
      await store.dispatch(testStore.actionCreators.removeSshKey(key1));
    } catch (e) {
      // no-op
    }

    const actions = store.getActions();
    const expectedActions: testStore.KnownAction[] = [
      {
        type: testStore.Type.REQUEST_KEYS,
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
