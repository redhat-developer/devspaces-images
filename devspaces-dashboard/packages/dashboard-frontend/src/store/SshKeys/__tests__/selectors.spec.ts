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
import { key1, key2 } from '@/store/SshKeys/__tests__/stub';
import {
  selectSshKeys,
  selectSshKeysError,
  selectSshKeysIsLoading,
} from '@/store/SshKeys/selectors';

import * as store from '..';

describe('SSH Keys, selectors', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the error', () => {
    const fakeStore = new FakeStoreBuilder()
      .withSshKeys({ keys: [], error: 'Something unexpected' }, false)
      .build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, store.KnownAction>
    >;
    const state = fakeStore.getState();

    const selectedError = selectSshKeysError(state);
    expect(selectedError).toEqual('Something unexpected');
  });

  it('should return all tokens', () => {
    const fakeStore = new FakeStoreBuilder()
      .withSshKeys({ keys: [key1, key2] }, false)
      .build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, store.KnownAction>
    >;
    const state = fakeStore.getState();

    const allSshKeys = selectSshKeys(state);
    expect(allSshKeys).toEqual([key1, key2]);
  });

  it('should return isLoading state', () => {
    const fakeStore = new FakeStoreBuilder()
      .withSshKeys({ keys: [key1, key2] }, true)
      .build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, store.KnownAction>
    >;
    const state = fakeStore.getState();

    const isLoading = selectSshKeysIsLoading(state);
    expect(isLoading).toEqual(true);
  });
});
