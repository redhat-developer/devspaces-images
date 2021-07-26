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
import * as dwPluginsStore from '..';
import { AppState } from '../../..';

// mute the outputs
console.error = jest.fn();

const plugin = {
  schemaVersion: '2.1.0',
  metadata: {
    name: 'void-sample',
  },
} as IDevWorkspaceDevfile;

describe('dwPlugins store', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('actions', () => {

    it('should create REQUEST_DW_PLUGIN and RECEIVE_DW_PLUGIN when fetching a plugin', async () => {
      (mockAxios.get as jest.Mock).mockResolvedValueOnce({
        data: JSON.stringify(plugin),
      });

      const store = new FakeStoreBuilder().build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, dwPluginsStore.KnownAction>>;

      const url = 'devworkspace-devfile-location';
      await store.dispatch(dwPluginsStore.actionCreators.requestDwDevfiles(url));

      const actions = store.getActions();

      const expectedActions: dwPluginsStore.KnownAction[] = [{
        type: 'REQUEST_DW_PLUGIN',
        url,
      }, {
        type: 'RECEIVE_DW_PLUGIN',
        plugin,
        url,
      }];

      expect(actions).toEqual(expectedActions);
    });

    it('should create REQUEST_DW_PLUGIN and RECEIVE_DW_PLUGIN_ERROR when failed to fetch a plugin', async () => {
      (mockAxios.get as jest.Mock).mockRejectedValueOnce({
        isAxiosError: true,
        code: '500',
        message: 'unexpected error',
      } as AxiosError);

      const store = new FakeStoreBuilder().build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, dwPluginsStore.KnownAction>>;

      const url = 'devworkspace-devfile-location';
      try {
        await store.dispatch(dwPluginsStore.actionCreators.requestDwDevfiles(url));
      } catch (e) {
        // noop
      }
      const actions = store.getActions();

      const expectedActions: dwPluginsStore.KnownAction[] = [{
        type: 'REQUEST_DW_PLUGIN',
        url,
      }, {
        type: 'RECEIVE_DW_PLUGIN_ERROR',
        error: expect.stringContaining('unexpected error'),
        url,
      }];

      expect(actions).toEqual(expectedActions);
    });

    it('should create REQUEST_DW_PLUGIN and RECEIVE_DW_PLUGIN when fetching the default editor', async () => {
      (mockAxios.get as jest.Mock).mockResolvedValueOnce({
        data: JSON.stringify(plugin),
      });

      const store = new FakeStoreBuilder().build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, dwPluginsStore.KnownAction>>;

      const settings = {
        cheWorkspacePluginRegistryUrl: 'plugin-registry-location',
        'che.factory.default_editor': 'default-editor',
      } as che.WorkspaceSettings;
      await store.dispatch(dwPluginsStore.actionCreators.requestDwDefaultEditor(settings));

      const actions = store.getActions();

      const expectedActions: dwPluginsStore.KnownAction[] = [{
        type: 'REQUEST_DW_PLUGIN',
        url: expect.stringContaining('default-editor'),
      }, {
        type: 'REQUEST_DW_DEFAULT_EDITOR',
      }, {
        type: 'RECEIVE_DW_PLUGIN',
        plugin,
        url: expect.stringContaining('default-editor'),
      }];

      expect(actions).toEqual(expectedActions);
    });

    it('should create REQUEST_DW_PLUGIN, RECEIVE_DW_PLUGIN_ERROR and RECEIVE_DW_DEFAULT_EDITOR_ERROR when failed to fetch the default editor', async () => {
      (mockAxios.get as jest.Mock).mockRejectedValueOnce({
        isAxiosError: true,
        code: '500',
        message: 'unexpected error',
      } as AxiosError);

      const store = new FakeStoreBuilder().build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, dwPluginsStore.KnownAction>>;

      const settings = {
        cheWorkspacePluginRegistryUrl: 'plugin-registry-location',
        'che.factory.default_editor': 'default-editor',
      } as che.WorkspaceSettings;
      try {
        await store.dispatch(dwPluginsStore.actionCreators.requestDwDefaultEditor(settings));
      } catch (e) {
        // noop
      }
      const actions = store.getActions();

      const expectedActions: dwPluginsStore.KnownAction[] = [{
        type: 'REQUEST_DW_PLUGIN',
        url: expect.stringContaining('default-editor'),
      }, {
        type: 'REQUEST_DW_DEFAULT_EDITOR',
      }, {
        type: 'RECEIVE_DW_PLUGIN_ERROR',
        error: expect.stringContaining('unexpected error'),
        url: expect.stringContaining('default-editor'),
      }, {
        type: 'RECEIVE_DW_DEFAULT_EDITOR_ERROR',
        error: expect.stringContaining('unexpected error'),
      }];

      expect(actions).toEqual(expectedActions);
    });

    it('should create only RECEIVE_DW_DEFAULT_EDITOR_ERROR if workspace settings don"t have necessary fields', async () => {
      (mockAxios.get as jest.Mock).mockResolvedValueOnce({
        data: {},
      });

      const store = new FakeStoreBuilder().build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, dwPluginsStore.KnownAction>>;

      const settings = {} as che.WorkspaceSettings;
      try {
        await store.dispatch(dwPluginsStore.actionCreators.requestDwDefaultEditor(settings));
      } catch (e) {
        // noop
      }
      const actions = store.getActions();

      const expectedActions: dwPluginsStore.KnownAction[] = [{
        type: 'RECEIVE_DW_DEFAULT_EDITOR_ERROR',
        error: 'Failed to load the default editor, reason: plugin registry URL or default editor ID is not provided by Che server.',
      }];

      expect(actions).toEqual(expectedActions);
      expect(mockAxios.get).not.toHaveBeenCalled();
    });

  });

  describe('reducers', () => {

    it('should return initial state', () => {
      const incomingAction: dwPluginsStore.RequestDwPluginAction = {
        type: 'REQUEST_DW_PLUGIN',
        url: 'devfile-location',
      };
      const initialState = dwPluginsStore.reducer(undefined, incomingAction);

      const expectedState: dwPluginsStore.State = {
        isLoading: false,
        plugins: {},
      };

      expect(initialState).toEqual(expectedState);
    });

    it('should return state if action type is not matched', () => {
      const initialState: dwPluginsStore.State = {
        isLoading: true,
        plugins: {},
      } as dwPluginsStore.State;
      const incomingAction = {
        type: 'OTHER_ACTION',
      } as AnyAction;
      const newState = dwPluginsStore.reducer(initialState, incomingAction);

      const expectedState: dwPluginsStore.State = {
        isLoading: true,
        plugins: {},
      };
      expect(newState).toEqual(expectedState);

    });

    it('should handle REQUEST_DW_PLUGIN', () => {
      const initialState: dwPluginsStore.State = {
        isLoading: false,
        plugins: {
          'devfile-location': {
            error: 'unexpected error',
          },
        },
      };
      const incomingAction: dwPluginsStore.RequestDwPluginAction = {
        type: 'REQUEST_DW_PLUGIN',
        url: 'devfile-location',
      };

      const newState = dwPluginsStore.reducer(initialState, incomingAction);

      const expectedState: dwPluginsStore.State = {
        isLoading: true,
        plugins: {
          'devfile-location': {},
        },
      };

      expect(newState).toEqual(expectedState);
    });

    it('should handle REQUEST_DW_DEFAULT_EDITOR', () => {
      const initialState: dwPluginsStore.State = {
        isLoading: false,
        plugins: {},
        defaultEditorError: 'unexpected error',
      };
      const incomingAction: dwPluginsStore.RequestDwDefaultEditorAction = {
        type: 'REQUEST_DW_DEFAULT_EDITOR',
      };

      const newState = dwPluginsStore.reducer(initialState, incomingAction);

      const expectedState: dwPluginsStore.State = {
        isLoading: true,
        plugins: {},
      };

      expect(newState).toEqual(expectedState);
    });

    it('should handle RECEIVE_DW_PLUGIN', () => {
      const initialState: dwPluginsStore.State = {
        isLoading: true,
        plugins: {},
      };
      const incomingAction: dwPluginsStore.ReceiveDwPluginAction = {
        type: 'RECEIVE_DW_PLUGIN',
        url: 'devfile-location',
        plugin,
      };

      const newState = dwPluginsStore.reducer(initialState, incomingAction);

      const expectedState: dwPluginsStore.State = {
        isLoading: false,
        plugins: {
          'devfile-location': {
            plugin,
          },
        },
      };

      expect(newState).toEqual(expectedState);
    });

    it('should handle RECEIVE_DW_PLUGIN_ERROR', () => {
      const initialState: dwPluginsStore.State = {
        isLoading: true,
        plugins: {},
      };
      const incomingAction: dwPluginsStore.ReceiveDwPluginErrorAction = {
        type: 'RECEIVE_DW_PLUGIN_ERROR',
        url: 'devfile-location',
        error: 'unexpected error',
      };

      const newState = dwPluginsStore.reducer(initialState, incomingAction);

      const expectedState: dwPluginsStore.State = {
        isLoading: false,
        plugins: {
          'devfile-location': {
            error: 'unexpected error',
          },
        },
      };

      expect(newState).toEqual(expectedState);
    });

    it('should handle RECEIVE_DW_DEFAULT_EDITOR_ERROR', () => {
      const initialState: dwPluginsStore.State = {
        isLoading: true,
        plugins: {},
      };
      const incomingAction: dwPluginsStore.ReceiveDwDefaultEditorErrorAction = {
        type: 'RECEIVE_DW_DEFAULT_EDITOR_ERROR',
        error: 'unexpected error',
      };

      const newState = dwPluginsStore.reducer(initialState, incomingAction);

      const expectedState: dwPluginsStore.State = {
        isLoading: false,
        plugins: {},
        defaultEditorError: 'unexpected error',
      };

      expect(newState).toEqual(expectedState);
    });

  });

});
