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
import devfileApi from '../../../../services/devfileApi';
import { FakeStoreBuilder } from '../../../__mocks__/storeBuilder';
import * as dwPluginsStore from '..';
import { AppState } from '../../..';
import axios from 'axios';

// mute the outputs
console.error = jest.fn();

const plugin = {
  schemaVersion: '2.1.0',
  metadata: {
    name: 'void-sample',
  },
} as devfileApi.Devfile;

describe('dwPlugins store', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('actions', () => {
    it('should create REQUEST_DW_PLUGIN and RECEIVE_DW_PLUGIN when fetching a plugin', async () => {
      (mockAxios.get as jest.Mock).mockResolvedValueOnce({
        data: JSON.stringify(plugin),
      });

      const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, dwPluginsStore.KnownAction>
      >;

      const url = 'devworkspace-devfile-location';
      await store.dispatch(dwPluginsStore.actionCreators.requestDwDevfile(url));

      const actions = store.getActions();

      const expectedActions: dwPluginsStore.KnownAction[] = [
        {
          type: 'REQUEST_DW_PLUGIN',
          url,
        },
        {
          type: 'RECEIVE_DW_PLUGIN',
          plugin,
          url,
        },
      ];

      expect(actions).toEqual(expectedActions);
    });

    it('should create REQUEST_DW_PLUGIN and RECEIVE_DW_PLUGIN_ERROR when failed to fetch a plugin', async () => {
      (mockAxios.get as jest.Mock).mockRejectedValueOnce({
        isAxiosError: true,
        code: '500',
        message: 'Something unexpected happened.',
      } as AxiosError);

      const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, dwPluginsStore.KnownAction>
      >;

      const url = 'devworkspace-devfile-location';
      try {
        await store.dispatch(dwPluginsStore.actionCreators.requestDwDevfile(url));
      } catch (e) {
        // noop
      }
      const actions = store.getActions();

      const expectedActions: dwPluginsStore.KnownAction[] = [
        {
          type: 'REQUEST_DW_PLUGIN',
          url,
        },
        {
          type: 'RECEIVE_DW_PLUGIN_ERROR',
          error: expect.stringContaining('Something unexpected happened.'),
          url,
        },
      ];

      expect(actions).toEqual(expectedActions);
    });

    it('should create REQUEST_DW_EDITOR and RECEIVE_DW_EDITOR when fetching the default editor', async () => {
      (mockAxios.get as jest.Mock).mockResolvedValueOnce({
        data: JSON.stringify(plugin),
      });

      const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, dwPluginsStore.KnownAction>
      >;

      const settings = {
        cheWorkspacePluginRegistryUrl: 'plugin-registry-location',
        'che.factory.default_editor': 'default-editor',
      } as che.WorkspaceSettings;
      await store.dispatch(dwPluginsStore.actionCreators.requestDwDefaultEditor(settings));
      const actions = store.getActions();

      const expectedActions: dwPluginsStore.KnownAction[] = [
        {
          type: 'REQUEST_DW_DEFAULT_EDITOR',
        },
        {
          type: 'REQUEST_DW_EDITOR',
          editorName: 'default-editor',
          url: 'plugin-registry-location/plugins/default-editor/devfile.yaml',
        },
        {
          editorName: 'default-editor',
          plugin: {
            metadata: expect.objectContaining({ name: 'void-sample' }),
            schemaVersion: '2.1.0',
          },
          type: 'RECEIVE_DW_EDITOR',

          url: 'plugin-registry-location/plugins/default-editor/devfile.yaml',
        },
        {
          type: 'RECEIVE_DW_DEFAULT_EDITOR',
          defaultEditorName: 'default-editor',
          url: 'plugin-registry-location/plugins/default-editor/devfile.yaml',
        },
      ];
      expect(actions).toEqual(expectedActions);
    });

    it('should create REQUEST_DW_EDITOR and RECEIVE_DW_EDITOR when fetching http editor', async () => {
      (mockAxios.get as jest.Mock).mockResolvedValueOnce({
        data: JSON.stringify(plugin),
      });

      const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, dwPluginsStore.KnownAction>
      >;

      // no plugin url as it should fetch from the editor directly
      const settings = {
        'che.factory.default_editor': 'default-editor',
      } as che.WorkspaceSettings;
      const editorLink = 'https://my-fake-editor.yaml';
      await store.dispatch(dwPluginsStore.actionCreators.requestDwEditor(settings, editorLink));
      const actions = store.getActions();

      const expectedActions: dwPluginsStore.KnownAction[] = [
        {
          type: 'REQUEST_DW_EDITOR',
          url: 'https://my-fake-editor.yaml',
          editorName: editorLink,
        },
        {
          type: 'RECEIVE_DW_EDITOR',
          url: 'https://my-fake-editor.yaml',
          editorName: editorLink,
          plugin,
        },
      ];
      expect(actions).toEqual(expectedActions);

      // check that we fetched the editor on axios
      expect(axios.get).toBeCalledWith(editorLink);
    });

    it('should create REQUEST_DW_EDITOR and RECEIVE_DW_EDITOR_ERROR when failed to fetch an editor', async () => {
      (mockAxios.get as jest.Mock).mockRejectedValueOnce({
        isAxiosError: true,
        code: '500',
        message: 'Something unexpected happened.',
      } as AxiosError);

      // no plugin url as it should fetch from the editor directly
      const settings = {
        'che.factory.default_editor': 'default-editor',
      } as che.WorkspaceSettings;
      const editorLink = 'https://my-fake-editor.yaml';

      const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, dwPluginsStore.KnownAction>
      >;

      try {
        await store.dispatch(dwPluginsStore.actionCreators.requestDwEditor(settings, editorLink));
      } catch (e) {
        // noop
      }
      const actions = store.getActions();

      const expectedActions: dwPluginsStore.KnownAction[] = [
        {
          type: 'REQUEST_DW_EDITOR',
          url: 'https://my-fake-editor.yaml',
          editorName: editorLink,
        },
        {
          type: 'RECEIVE_DW_EDITOR_ERROR',
          url: 'https://my-fake-editor.yaml',
          error: expect.stringContaining(
            'Failed to load the editor https://my-fake-editor.yaml. Invalid devfile.',
          ),
          editorName: editorLink,
        },
      ];

      expect(actions).toEqual(expectedActions);
    });

    it('should create only RECEIVE_DW_DEFAULT_EDITOR_ERROR if workspace settings do not have necessary fields', async () => {
      (mockAxios.get as jest.Mock).mockResolvedValueOnce({
        data: {},
      });

      const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, dwPluginsStore.KnownAction>
      >;

      const settings = {} as che.WorkspaceSettings;
      try {
        await store.dispatch(dwPluginsStore.actionCreators.requestDwDefaultEditor(settings));
      } catch (e) {
        // noop
      }
      const actions = store.getActions();

      const expectedActions: dwPluginsStore.KnownAction[] = [
        {
          type: 'REQUEST_DW_DEFAULT_EDITOR',
        },
        {
          type: 'RECEIVE_DW_DEFAULT_EDITOR_ERROR',
          error:
            'Failed to load the default editor, reason: default editor ID is not provided by Che server.',
        },
      ];

      expect(actions).toEqual(expectedActions);
      expect(mockAxios.get).not.toHaveBeenCalled();
    });

    it('should create REQUEST_DW_EDITOR and RECEIVE_DW__EDITOR_ERROR when missing plugin registry URL to fetch the editor', async () => {
      (mockAxios.get as jest.Mock).mockRejectedValueOnce({
        isAxiosError: true,
        code: '500',
        message: 'unexpected error',
      } as AxiosError);

      const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, dwPluginsStore.KnownAction>
      >;

      const settings = {
        'che.factory.default_editor': 'default-editor',
      } as che.WorkspaceSettings;
      try {
        await store.dispatch(dwPluginsStore.actionCreators.requestDwDefaultEditor(settings));
      } catch (e) {
        // noop
      }
      const actions = store.getActions();

      const expectedActions: dwPluginsStore.KnownAction[] = [
        {
          type: 'REQUEST_DW_DEFAULT_EDITOR',
        },
        {
          type: 'RECEIVE_DW_EDITOR_ERROR',
          url: 'undefined/plugins/default-editor/devfile.yaml',
          editorName: 'default-editor',
          error: expect.stringContaining(' plugin registry URL is not provided'),
        },
      ];
      expect(actions).toEqual(expectedActions);
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
        editors: {},
      };

      expect(initialState).toEqual(expectedState);
    });

    it('should return state if action type is not matched', () => {
      const initialState: dwPluginsStore.State = {
        isLoading: true,
        editors: {},
        plugins: {},
      } as dwPluginsStore.State;
      const incomingAction = {
        type: 'OTHER_ACTION',
      } as AnyAction;
      const newState = dwPluginsStore.reducer(initialState, incomingAction);

      const expectedState: dwPluginsStore.State = {
        isLoading: true,
        plugins: {},
        editors: {},
      };
      expect(newState).toEqual(expectedState);
    });

    it('should handle REQUEST_DW_PLUGIN', () => {
      const initialState: dwPluginsStore.State = {
        isLoading: false,
        editors: {},
        plugins: {
          'devfile-location': {
            error: 'unexpected error',
            url: 'devfile-location',
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
        editors: {},
        plugins: {
          'devfile-location': {
            url: 'devfile-location',
          },
        },
      };

      expect(newState).toEqual(expectedState);
    });

    it('should handle REQUEST_DW_EDITOR', () => {
      const initialState: dwPluginsStore.State = {
        isLoading: false,
        editors: {
          foo: {
            url: 'editor-location',
            error: 'unexpected error',
          },
        },
        plugins: {},
      };
      const incomingAction: dwPluginsStore.RequestDwEditorAction = {
        type: 'REQUEST_DW_EDITOR',
        editorName: 'foo',
        url: 'editor-location',
      };

      const newState = dwPluginsStore.reducer(initialState, incomingAction);

      const expectedState: dwPluginsStore.State = {
        isLoading: true,
        editors: {
          foo: {
            plugin: undefined,
            url: 'editor-location',
          },
        },
        plugins: {},
      };

      expect(newState).toEqual(expectedState);
    });

    it('should handle REQUEST_DW_DEFAULT_EDITOR', () => {
      const initialState: dwPluginsStore.State = {
        isLoading: false,
        editors: {},
        plugins: {},
        defaultEditorError: 'unexpected error',
      };
      const incomingAction: dwPluginsStore.RequestDwDefaultEditorAction = {
        type: 'REQUEST_DW_DEFAULT_EDITOR',
      };

      const newState = dwPluginsStore.reducer(initialState, incomingAction);

      const expectedState: dwPluginsStore.State = {
        isLoading: true,
        editors: {},
        plugins: {},
      };

      expect(newState).toEqual(expectedState);
    });

    it('should handle RECEIVE_DW_PLUGIN', () => {
      const initialState: dwPluginsStore.State = {
        isLoading: true,
        editors: {},
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
        editors: {},
        plugins: {
          'devfile-location': {
            url: 'devfile-location',
            plugin,
          },
        },
      };

      expect(newState).toEqual(expectedState);
    });

    it('should handle RECEIVE_DW_EDITOR', () => {
      const initialState: dwPluginsStore.State = {
        isLoading: true,
        editors: {},
        plugins: {},
      };
      const incomingAction: dwPluginsStore.ReceiveDwEditorAction = {
        type: 'RECEIVE_DW_EDITOR',
        url: 'devfile-location',
        editorName: 'my-editor',
        plugin,
      };

      const newState = dwPluginsStore.reducer(initialState, incomingAction);

      const expectedState: dwPluginsStore.State = {
        isLoading: false,
        editors: {
          'my-editor': {
            url: 'devfile-location',
            plugin,
          },
        },
        plugins: {},
      };

      expect(newState).toEqual(expectedState);
    });

    it('should handle RECEIVE_DW_PLUGIN_ERROR', () => {
      const initialState: dwPluginsStore.State = {
        isLoading: true,
        editors: {},
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
        editors: {},
        plugins: {
          'devfile-location': {
            url: 'devfile-location',
            error: 'unexpected error',
          },
        },
      };

      expect(newState).toEqual(expectedState);
    });

    it('should handle RECEIVE_DW_EDITOR_ERROR', () => {
      const initialState: dwPluginsStore.State = {
        isLoading: true,
        editors: {},
        plugins: {},
      };
      const incomingAction: dwPluginsStore.RequestDwEditorErrorAction = {
        type: 'RECEIVE_DW_EDITOR_ERROR',
        url: 'editor-location',
        editorName: 'foo',
        error: 'unexpected error',
      };

      const newState = dwPluginsStore.reducer(initialState, incomingAction);

      const expectedState: dwPluginsStore.State = {
        isLoading: false,
        editors: {
          foo: {
            error: 'unexpected error',
            url: 'editor-location',
          },
        },
        plugins: {},
      };

      expect(newState).toEqual(expectedState);
    });

    it('should handle RECEIVE_DW_DEFAULT_EDITOR_ERROR', () => {
      const initialState: dwPluginsStore.State = {
        isLoading: true,
        editors: {},
        plugins: {},
      };
      const incomingAction: dwPluginsStore.ReceiveDwDefaultEditorErrorAction = {
        type: 'RECEIVE_DW_DEFAULT_EDITOR_ERROR',
        error: 'unexpected error',
      };

      const newState = dwPluginsStore.reducer(initialState, incomingAction);

      const expectedState: dwPluginsStore.State = {
        isLoading: false,
        editors: {},
        plugins: {},
        defaultEditorError: 'unexpected error',
      };

      expect(newState).toEqual(expectedState);
    });

    it('should handle RECEIVE_DW_DEFAULT_EDITOR', () => {
      const initialState: dwPluginsStore.State = {
        isLoading: true,
        editors: {},
        plugins: {},
      };
      const incomingAction: dwPluginsStore.ReceiveDwDefaultEditorAction = {
        type: 'RECEIVE_DW_DEFAULT_EDITOR',
        url: 'default-editor-location',
        defaultEditorName: 'hello',
      };

      const newState = dwPluginsStore.reducer(initialState, incomingAction);

      const expectedState: dwPluginsStore.State = {
        isLoading: false,
        editors: {},
        plugins: {},
        defaultEditorName: 'hello',
      };

      expect(newState).toEqual(expectedState);
    });
  });
});
