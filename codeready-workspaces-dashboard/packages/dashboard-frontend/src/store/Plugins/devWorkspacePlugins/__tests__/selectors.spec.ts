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

import mockAxios, { AxiosError } from 'axios';
import { MockStoreEnhanced } from 'redux-mock-store';
import { AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { IDevWorkspaceDevfile } from '@eclipse-che/devworkspace-client';
import { FakeStoreBuilder } from '../../../__mocks__/storeBuilder';
import * as store from '..';
import { AppState } from '../../..';
import { selectDwPlugins, selectDwPluginsList, selectDwDefaultEditorError } from '../selectors';

describe('dwPlugins selectors', () => {

  const plugins = {
    'plugin-location-1': {
      plugin: {
        schemaVersion: '2.1.0',
        metadata: {
          name: 'void-sample-1',
        },
      } as IDevWorkspaceDevfile,
    },
    'plugin-location-2': {
      plugin: {
        schemaVersion: '2.1.0',
        metadata: {
          name: 'void-sample-2',
        },
      } as IDevWorkspaceDevfile,
    },
    'plugin-location-3': {
      error: 'unexpected error',
    },
  };

  it('should return all plugins and errors', () => {
    const fakeStore = new FakeStoreBuilder()
      .withDwPlugins(
        plugins,
        false,
        'default editor fetching error',
      )
      .build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, store.KnownAction>>;
    const state = fakeStore.getState();

    const expectedPlugins = plugins;
    const selectedPlugins = selectDwPlugins(state);
    expect(selectedPlugins).toEqual(expectedPlugins);
  });

  it('should return array of plugins', () => {
    const fakeStore = new FakeStoreBuilder()
      .withDwPlugins(
        plugins,
        false,
        'default editor fetching error',
      )
      .build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, store.KnownAction>>;
    const state = fakeStore.getState();

    const expectedPlugins = [
      {
        schemaVersion: '2.1.0',
        metadata: {
          name: 'void-sample-1',
        },
      } as IDevWorkspaceDevfile,
      {
        schemaVersion: '2.1.0',
        metadata: {
          name: 'void-sample-2',
        },
      } as IDevWorkspaceDevfile,
    ];
    const selectedPlugins = selectDwPluginsList(state);
    expect(selectedPlugins).toEqual(expectedPlugins);
  });

  it('should return an error related to default editor fetching', () => {
    const fakeStore = new FakeStoreBuilder()
      .withDwPlugins(
        plugins,
        false,
        'default editor fetching error',
      )
      .build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, store.KnownAction>>;
    const state = fakeStore.getState();

    const selectedError = selectDwDefaultEditorError(state);
    expect(selectedError).toEqual('default editor fetching error');
  });

});
