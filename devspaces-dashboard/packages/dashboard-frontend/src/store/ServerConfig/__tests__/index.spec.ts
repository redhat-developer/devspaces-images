/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
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
import { FakeStoreBuilder } from '../../__mocks__/storeBuilder';
import * as dwServerConfigStore from '../../ServerConfig';
import { AppState } from '../..';

// mute the outputs
console.error = jest.fn();

describe('dwPlugins store', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('actions', () => {
    it('should create RECEIVE_DW_SERVER_CONFIG when fetching server config', async () => {
      (mockAxios.get as jest.Mock).mockResolvedValueOnce({
        data: {
          defaults: {
            editor: 'eclipse/theia/next',
            components: [
              {
                name: 'universal-developer-image',
                container: {
                  image: 'quay.io/devfile/universal-developer-image:ubi8-latest',
                },
              },
            ],
            plugins: [
              {
                editor: 'eclipse/theia/next',
                plugins: ['https://test.com/devfile.yaml'],
              },
            ],
            pvcStrategy: 'per-workspace',
          },
          timeouts: {
            inactivityTimeout: -1,
            runTimeout: -1,
          },
          cheNamespace: 'eclipse-che',
        },
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
        },
        {
          type: 'RECEIVE_DW_SERVER_CONFIG',
          config: {
            defaults: {
              editor: 'eclipse/theia/next',
              components: [
                {
                  name: 'universal-developer-image',
                  container: {
                    image: 'quay.io/devfile/universal-developer-image:ubi8-latest',
                  },
                },
              ],
              plugins: [
                {
                  editor: 'eclipse/theia/next',
                  plugins: ['https://test.com/devfile.yaml'],
                },
              ],
              pvcStrategy: 'per-workspace',
            },
            timeouts: {
              inactivityTimeout: -1,
              runTimeout: -1,
            },
            cheNamespace: 'eclipse-che',
          },
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
      },
      {
        type: 'RECEIVE_DW_SERVER_CONFIG_ERROR',
        error: 'Failed to fetch default plugins. Test error',
      },
    ];
    expect(actions).toEqual(expectedActions);
  });
});
