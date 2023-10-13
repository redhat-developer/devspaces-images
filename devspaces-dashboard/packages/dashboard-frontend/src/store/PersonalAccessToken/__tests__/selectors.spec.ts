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
import { token1, token2 } from '@/store/PersonalAccessToken/__tests__/stub';
import {
  selectPersonalAccessTokens,
  selectPersonalAccessTokensError,
  selectPersonalAccessTokensIsLoading,
} from '@/store/PersonalAccessToken/selectors';

import * as store from '..';

describe('Personal Access Token store, selectors', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the error', () => {
    const fakeStore = new FakeStoreBuilder()
      .withPersonalAccessTokens({ tokens: [], error: 'Something unexpected' }, false)
      .build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, store.KnownAction>
    >;
    const state = fakeStore.getState();

    const selectedError = selectPersonalAccessTokensError(state);
    expect(selectedError).toEqual('Something unexpected');
  });

  it('should return all tokens', () => {
    const fakeStore = new FakeStoreBuilder()
      .withPersonalAccessTokens({ tokens: [token1, token2] }, false)
      .build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, store.KnownAction>
    >;
    const state = fakeStore.getState();

    const allTokens = selectPersonalAccessTokens(state);
    expect(allTokens).toEqual([token1, token2]);
  });

  it('should return isLoading state', () => {
    const fakeStore = new FakeStoreBuilder()
      .withPersonalAccessTokens({ tokens: [token1, token2] }, true)
      .build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, store.KnownAction>
    >;
    const state = fakeStore.getState();

    const isLoading = selectPersonalAccessTokensIsLoading(state);
    expect(isLoading).toEqual(true);
  });
});
