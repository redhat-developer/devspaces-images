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
import * as testStore from '..';
import { AUTHORIZED } from '../../sanityCheckMiddleware';
import { token1, token2 } from './stub';

describe('Personal Access Token store', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial state', () => {
    const incomingAction: testStore.RequestTokensAction = {
      type: testStore.Type.REQUEST_TOKENS,
      check: AUTHORIZED,
    };

    const initialState = testStore.reducer(undefined, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      tokens: [],
      error: undefined,
    };
    expect(initialState).toEqual(expectedState);
  });

  it('should return state if action type is not matched', () => {
    const initialState: testStore.State = {
      isLoading: false,
      tokens: [token1, token2],
      error: undefined,
    };

    const incomingAction = {
      type: 'NOT_MATCHED',
      check: AUTHORIZED,
    } as AnyAction;
    const state = testStore.reducer(initialState, incomingAction);

    expect(state).toEqual(initialState);
  });

  it('should handle REQUEST_TOKENS', () => {
    const initialState: testStore.State = {
      isLoading: false,
      tokens: [token1, token2],
      error: 'an error',
    };

    const incomingAction: testStore.RequestTokensAction = {
      type: testStore.Type.REQUEST_TOKENS,
      check: AUTHORIZED,
    };
    const state = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: true,
      tokens: [token1, token2],
      error: undefined,
    };
    expect(state).toEqual(expectedState);
  });

  it('should handle RECEIVE_TOKENS', () => {
    const initialState: testStore.State = {
      isLoading: true,
      tokens: [token1],
      error: undefined,
    };

    const newToken1 = {
      ...token1,
      tokenData: 'new-token-data',
    } as api.PersonalAccessToken;
    const incomingAction: testStore.ReceiveTokensAction = {
      type: testStore.Type.RECEIVE_TOKENS,
      tokens: [newToken1, token2],
    };
    const state = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      tokens: [newToken1, token2],
      error: undefined,
    };
    expect(state).toEqual(expectedState);
  });

  it('should handle ADD_TOKEN', () => {
    const incomingAction: testStore.AddTokenAction = {
      type: testStore.Type.ADD_TOKEN,
      token: token2,
    };
    const initialState: testStore.State = {
      isLoading: false,
      tokens: [token1],
      error: undefined,
    };
    const state = testStore.reducer(initialState, incomingAction);
    const expectedState: testStore.State = {
      isLoading: false,
      tokens: [token1, token2],
      error: undefined,
    };
    expect(state).toEqual(expectedState);
  });

  it('should handle UPDATE_TOKEN', () => {
    const initialState: testStore.State = {
      isLoading: false,
      tokens: [token1, token2],
      error: undefined,
    };

    const newToken1 = {
      ...token1,
      tokenData: 'newTokenData',
    } as api.PersonalAccessToken;
    const incomingAction: testStore.UpdateTokenAction = {
      type: testStore.Type.UPDATE_TOKEN,
      token: newToken1,
    };

    const state = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      tokens: [newToken1, token2],
      error: undefined,
    };
    expect(state).toEqual(expectedState);
  });

  it('should handle REMOVE_TOKEN', () => {
    const initialState: testStore.State = {
      isLoading: false,
      tokens: [token1, token2],
      error: undefined,
    };

    const incomingAction: testStore.RemoveTokenAction = {
      type: testStore.Type.REMOVE_TOKEN,
      token: token1,
    };
    const state = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      tokens: [token2],
      error: undefined,
    };
    expect(state).toEqual(expectedState);
  });

  it('should handle RECEIVE_ERROR', () => {
    const initialState: testStore.State = {
      isLoading: true,
      tokens: [token1],
      error: undefined,
    };

    const incomingAction: testStore.ReceiveErrorAction = {
      type: testStore.Type.RECEIVE_ERROR,
      error: 'error',
    };
    const state = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      tokens: [token1],
      error: 'error',
    };
    expect(state).toEqual(expectedState);
  });
});
