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
import { FakeStoreBuilder } from '../../__mocks__/storeBuilder';
import { AppState } from '../..';
import { selectIsLoading, selectRegistries, selectError } from '../selectors';
import { AnyAction } from 'redux';

describe('dockerConfig selectors', () => {
  const registries = [
    {
      url: 'dummy.io',
      username: 'testname1',
      password: 'XXXXXXXXXXXXXXX',
    },
    {
      url: 'dummy.io',
      username: 'testname2',
      password: 'YYYYYYYYYYYYYYY',
    },
  ];

  describe('devworkspaces enabled', () => {
    it('should return all registries', () => {
      const fakeStore = new FakeStoreBuilder()
        .withDockerConfig(registries, false)
        .build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, AnyAction>>;
      const state = fakeStore.getState();

      const expectedRegistries = registries;
      const selectedRegistries = selectRegistries(state);
      expect(selectedRegistries).toEqual(expectedRegistries);
    });

    it('should return isLoading status', () => {
      const fakeStore = new FakeStoreBuilder()
        .withDockerConfig([], true)
        .build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, AnyAction>>;
      const state = fakeStore.getState();

      const isLoading = selectIsLoading(state);

      expect(isLoading).toBeTruthy();
    });

    it('should return an error related to default editor fetching', () => {
      const fakeStore = new FakeStoreBuilder()
        .withDockerConfig(registries, false, 'default editor fetching error')
        .build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, AnyAction>>;
      const state = fakeStore.getState();

      const selectedError = selectError(state);
      expect(selectedError).toEqual('default editor fetching error');
    });
  });

  describe('devworkspaces disabled', () => {
    it('should return all registries', () => {
      const fakeStore = new FakeStoreBuilder()
        .withDockerConfig(registries, false)
        .build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, AnyAction>>;
      const state = fakeStore.getState();

      const expectedRegistries = registries;
      const selectedRegistries = selectRegistries(state);
      expect(selectedRegistries).toEqual(expectedRegistries);
    });

    it('should return isLoading status', () => {
      const fakeStore = new FakeStoreBuilder()
        .withDockerConfig([], true)
        .build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, AnyAction>>;
      const state = fakeStore.getState();

      const isLoading = selectIsLoading(state);

      expect(isLoading).toBeTruthy();
    });

    it('should return an error related to default editor fetching', () => {
      const fakeStore = new FakeStoreBuilder()
        .withDockerConfig(registries, false, 'default editor fetching error')
        .build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, AnyAction>>;
      const state = fakeStore.getState();

      const selectedError = selectError(state);
      expect(selectedError).toEqual('default editor fetching error');
    });
  });
});
