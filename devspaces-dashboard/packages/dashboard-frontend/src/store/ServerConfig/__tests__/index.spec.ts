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
import mockAxios from 'axios';
import { MockStoreEnhanced } from 'redux-mock-store';
import { ThunkDispatch } from 'redux-thunk';
import { AppState } from '../..';
import { AUTHORIZED } from '../../sanityCheckMiddleware';
import * as dwServerConfigStore from '../../ServerConfig';
import { FakeStoreBuilder } from '../../__mocks__/storeBuilder';

// mute the outputs
console.error = jest.fn();

describe('dwPlugins store', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('actions', () => {
    const serverConfig: api.IServerConfig = {
      containerBuild: {
        disableContainerBuildCapabilities: false,
        containerBuildConfiguration: {
          openShiftSecurityContextConstraint: 'container-build',
        },
      },
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
      pluginRegistry: {
        openVSXURL: '',
      },
      timeouts: {
        inactivityTimeout: -1,
        runTimeout: -1,
        startTimeout: 300,
      },
      cheNamespace: 'eclipse-che',
      devfileRegistry: {
        disableInternalRegistry: false,
        externalDevfileRegistries: [],
      },
      devfileRegistryURL: '',
      devfileRegistryInternalURL: '',
      pluginRegistryURL: '',
      pluginRegistryInternalURL: '',
    };

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
