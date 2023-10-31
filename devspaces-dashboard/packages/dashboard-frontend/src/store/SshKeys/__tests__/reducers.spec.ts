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

import { api } from '@eclipse-che/common';
import { AnyAction } from 'redux';

import { AUTHORIZED } from '@/store/sanityCheckMiddleware';
import { key1, key2 } from '@/store/SshKeys/__tests__/stub';

import * as testStore from '..';

describe('Personal Access Token store', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial state', () => {
    const incomingAction: testStore.RequestKeysAction = {
      type: testStore.Type.REQUEST_KEYS,
      check: AUTHORIZED,
    };

    const initialState = testStore.reducer(undefined, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      keys: [],
      error: undefined,
    };
    expect(initialState).toEqual(expectedState);
  });

  it('should return state if action type is not matched', () => {
    const initialState: testStore.State = {
      isLoading: false,
      keys: [key1, key2],
      error: undefined,
    };

    const incomingAction = {
      type: 'NOT_MATCHED',
      check: AUTHORIZED,
    } as AnyAction;
    const state = testStore.reducer(initialState, incomingAction);

    expect(state).toEqual(initialState);
  });

  it('should handle REQUEST_KEYS', () => {
    const initialState: testStore.State = {
      isLoading: false,
      keys: [key1, key2],
      error: 'an error',
    };

    const incomingAction: testStore.RequestKeysAction = {
      type: testStore.Type.REQUEST_KEYS,
      check: AUTHORIZED,
    };
    const state = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: true,
      keys: [key1, key2],
      error: undefined,
    };
    expect(state).toEqual(expectedState);
  });

  it('should handle RECEIVE_KEYS', () => {
    const initialState: testStore.State = {
      isLoading: true,
      keys: [key1],
      error: undefined,
    };

    const newKey1 = {
      ...key1,
      data: 'new-key-data',
    } as api.SshKey;
    const incomingAction: testStore.ReceiveKeysAction = {
      type: testStore.Type.RECEIVE_KEYS,
      keys: [newKey1, key2],
    };
    const state = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      keys: [newKey1, key2],
      error: undefined,
    };
    expect(state).toEqual(expectedState);
  });

  it('should handle ADD_KEY', () => {
    const incomingAction: testStore.AddKeyAction = {
      type: testStore.Type.ADD_KEY,
      key: key2,
    };
    const initialState: testStore.State = {
      isLoading: false,
      keys: [key1],
      error: undefined,
    };
    const state = testStore.reducer(initialState, incomingAction);
    const expectedState: testStore.State = {
      isLoading: false,
      keys: [key1, key2],
      error: undefined,
    };
    expect(state).toEqual(expectedState);
  });

  it('should handle REMOVE_KEY', () => {
    const initialState: testStore.State = {
      isLoading: false,
      keys: [key1, key2],
      error: undefined,
    };

    const incomingAction: testStore.RemoveKeyAction = {
      type: testStore.Type.REMOVE_KEY,
      key: key1,
    };
    const state = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      keys: [key2],
      error: undefined,
    };
    expect(state).toEqual(expectedState);
  });

  it('should handle RECEIVE_ERROR', () => {
    const initialState: testStore.State = {
      isLoading: true,
      keys: [key1],
      error: undefined,
    };

    const incomingAction: testStore.ReceiveErrorAction = {
      type: testStore.Type.RECEIVE_ERROR,
      error: 'error',
    };
    const state = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      keys: [key1],
      error: 'error',
    };
    expect(state).toEqual(expectedState);
  });
});
