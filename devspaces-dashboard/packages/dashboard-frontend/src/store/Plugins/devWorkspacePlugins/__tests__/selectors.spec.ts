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

import devfileApi from '@/services/devfileApi';
import { AppState } from '@/store';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import {
  selectDwDefaultEditorError,
  selectDwPlugins,
  selectDwPluginsList,
} from '@/store/Plugins/devWorkspacePlugins/selectors';

import * as store from '..';

const url = 'devworkspace-devfile-location';

describe('dwPlugins selectors', () => {
  const plugins = {
    'plugin-location-1': {
      url,
      plugin: {
        schemaVersion: '2.1.0',
        metadata: {
          name: 'void-sample-1',
        },
      } as devfileApi.Devfile,
    },
    'plugin-location-2': {
      url,
      plugin: {
        schemaVersion: '2.1.0',
        metadata: {
          name: 'void-sample-2',
        },
      } as devfileApi.Devfile,
    },
    'plugin-location-3': {
      url,
      error: 'unexpected error',
    },
  };

  it('should return all plugins and errors', () => {
    const fakeStore = new FakeStoreBuilder()
      .withDwPlugins(plugins, false, 'default editor fetching error')
      .build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, store.KnownAction>
    >;
    const state = fakeStore.getState();

    const expectedPlugins = plugins;
    const selectedPlugins = selectDwPlugins(state);
    expect(selectedPlugins).toEqual(expectedPlugins);
  });

  it('should return array of plugins', () => {
    const fakeStore = new FakeStoreBuilder()
      .withDwPlugins(plugins, false, 'default editor fetching error')
      .build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, store.KnownAction>
    >;
    const state = fakeStore.getState();

    const expectedPlugins = [
      {
        schemaVersion: '2.1.0',
        metadata: {
          name: 'void-sample-1',
        },
      } as devfileApi.Devfile,
      {
        schemaVersion: '2.1.0',
        metadata: {
          name: 'void-sample-2',
        },
      } as devfileApi.Devfile,
    ];
    const selectedPlugins = selectDwPluginsList(state);
    expect(selectedPlugins).toEqual(expectedPlugins);
  });

  it('should return an error related to default editor fetching', () => {
    const fakeStore = new FakeStoreBuilder()
      .withDwPlugins(plugins, false, 'default editor fetching error')
      .build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, store.KnownAction>
    >;
    const state = fakeStore.getState();

    const selectedError = selectDwDefaultEditorError(state);
    expect(selectedError).toEqual('default editor fetching error');
  });
});
