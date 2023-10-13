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

import mockAxios from 'axios';
import { MockStoreEnhanced } from 'redux-mock-store';
import { ThunkDispatch } from 'redux-thunk';

import { AppState } from '@/store';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { AUTHORIZED } from '@/store/sanityCheckMiddleware';
import * as dwServerConfigStore from '@/store/ServerConfig';
import { serverConfig } from '@/store/ServerConfig/__tests__/stubs';

// mute the outputs
console.error = jest.fn();

describe('dwPlugins store', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('actions', () => {
    it('should create RECEIVE_DW_SERVER_CONFIG when fetching server config', async () => {
      (mockAxios.get as jest.Mock).mockResolvedValueOnce({
        data: serverConfig,
      });

      const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, dwServerConfigStore.KnownAction>
      >;

      await store.dispatch(dwServerConfigStore.actionCreators.requestServerConfig());

      const actions = store.getActions();

      const expectedActions: dwServerConfigStore.KnownAction[] = [
        {
          type: 'REQUEST_DW_SERVER_CONFIG',
          check: AUTHORIZED,
        },
        {
          type: 'RECEIVE_DW_SERVER_CONFIG',
          config: serverConfig,
        },
      ];
      expect(actions).toEqual(expectedActions);
    });
  });

  it('should create RECEIVE_DW_SERVER_CONFIG_ERROR when fetching server and got an error', async () => {
    (mockAxios.get as jest.Mock).mockRejectedValueOnce('Test error');

    const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, dwServerConfigStore.KnownAction>
    >;

    try {
      await store.dispatch(dwServerConfigStore.actionCreators.requestServerConfig());
    } catch (e) {
      // noop
    }

    const actions = store.getActions();

    const expectedActions: dwServerConfigStore.KnownAction[] = [
      {
        type: 'REQUEST_DW_SERVER_CONFIG',
        check: AUTHORIZED,
      },
      {
        type: 'RECEIVE_DW_SERVER_CONFIG_ERROR',
        error: 'Test error',
      },
    ];
    expect(actions).toEqual(expectedActions);
  });
});
