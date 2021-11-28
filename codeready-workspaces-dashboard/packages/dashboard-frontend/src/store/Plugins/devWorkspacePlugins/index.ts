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

import { safeLoad } from 'js-yaml';
import { Action, Reducer } from 'redux';
import common from '@eclipse-che/common';
import devfileApi from '../../../services/devfileApi';
import { AppThunk } from '../..';
import { fetchDevfile, fetchData } from '../../../services/registry/devfiles';
import { createObject } from '../../helpers';

export interface PluginDefinition {
  plugin?: devfileApi.Devfile;
  url: string;
  error?: string;
}

export interface State {
  isLoading: boolean;
  plugins: {
    [url: string]: PluginDefinition;
  };
  editors: {
    [editorName: string]: PluginDefinition;
  };
  defaultEditorName?: string;
  defaultEditorError?: string;
}

export interface RequestDwDefaultEditorAction {
  type: 'REQUEST_DW_DEFAULT_EDITOR';
}

export interface RequestDwPluginAction {
  type: 'REQUEST_DW_PLUGIN';
  url: string;
}

export interface ReceiveDwPluginAction {
  type: 'RECEIVE_DW_PLUGIN';
  url: string;
  plugin: devfileApi.Devfile;
}

export interface ReceiveDwPluginErrorAction {
  type: 'RECEIVE_DW_PLUGIN_ERROR';
  url: string;
  error: string;
}

export interface ReceiveDwEditorAction {
  type: 'RECEIVE_DW_EDITOR';
  url: string;
  editorName: string;
  plugin: devfileApi.Devfile;
}

export interface RequestDwEditorAction {
  type: 'REQUEST_DW_EDITOR';
  url: string;
  editorName: string;
}

export interface ReceiveDwDefaultEditorAction {
  type: 'RECEIVE_DW_DEFAULT_EDITOR';
  url: string;
  defaultEditorName: string;
}

export interface RequestDwEditorErrorAction {
  type: 'RECEIVE_DW_EDITOR_ERROR';
  editorName: string;
  url: string;
  error: string;
}

export interface ReceiveDwDefaultEditorErrorAction {
  type: 'RECEIVE_DW_DEFAULT_EDITOR_ERROR';
  error: string;
}

export type KnownAction =
  | RequestDwPluginAction
  | ReceiveDwPluginAction
  | ReceiveDwPluginErrorAction
  | RequestDwDefaultEditorAction
  | ReceiveDwDefaultEditorAction
  | ReceiveDwDefaultEditorErrorAction
  | RequestDwEditorAction
  | ReceiveDwEditorAction
  | RequestDwEditorErrorAction;

export type ActionCreators = {
  requestDwDevfile: (url: string) => AppThunk<KnownAction, Promise<void>>;
  requestDwDefaultEditor: (settings: che.WorkspaceSettings) => AppThunk<KnownAction, Promise<void>>;
  requestDwEditor: (
    settings: che.WorkspaceSettings,
    editorName: string,
  ) => AppThunk<KnownAction, Promise<void>>;
};
export const actionCreators: ActionCreators = {
  requestDwDevfile:
    (url: string): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      dispatch({
        type: 'REQUEST_DW_PLUGIN',
        url,
      });

      try {
        const pluginContent = await fetchDevfile(url);
        const plugin = safeLoad(pluginContent) as devfileApi.Devfile;
        dispatch({
          type: 'RECEIVE_DW_PLUGIN',
          url,
          plugin,
        });
      } catch (e) {
        const errorMessage = common.helpers.errors.getMessage(e);
        dispatch({
          type: 'RECEIVE_DW_PLUGIN_ERROR',
          url,
          error: errorMessage,
        });
        throw errorMessage;
      }
    },

  requestDwEditor:
    (settings: che.WorkspaceSettings, editorName: string): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      let editorUrl;
      // check if the editor is an id or a path to a given editor
      if (editorName.startsWith('https://')) {
        editorUrl = editorName;
      } else {
        const pluginRegistryUrl = settings.cheWorkspacePluginRegistryUrl;
        editorUrl = `${settings.cheWorkspacePluginRegistryUrl}/plugins/${editorName}/devfile.yaml`;

        if (!pluginRegistryUrl) {
          const errorMessage =
            'Failed to load the default editor, reason: plugin registry URL is not provided by Che server.';
          dispatch({
            type: 'RECEIVE_DW_EDITOR_ERROR',
            url: editorUrl,
            editorName,
            error: errorMessage,
          });
          throw errorMessage;
        }
      }

      try {
        dispatch({
          type: 'REQUEST_DW_EDITOR',
          url: editorUrl,
          editorName,
        });
        const pluginContent = await fetchData<string>(editorUrl);
        const plugin = safeLoad(pluginContent) as devfileApi.Devfile;
        dispatch({
          type: 'RECEIVE_DW_EDITOR',
          editorName,
          url: editorUrl,
          plugin,
        });
      } catch (error) {
        console.log(`Failed to load the content of the editor ${editorName}`, error);
        const errorMessage = `Failed to load the editor ${editorName}. Invalid devfile. Check 'che-editor' param.`;
        dispatch({
          type: 'RECEIVE_DW_EDITOR_ERROR',
          url: editorUrl,
          editorName,
          error: errorMessage,
        });
        throw errorMessage;
      }
    },

  requestDwDefaultEditor:
    (settings: che.WorkspaceSettings): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      const defaultEditor = settings['che.factory.default_editor'];

      dispatch({
        type: 'REQUEST_DW_DEFAULT_EDITOR',
      });

      if (!defaultEditor) {
        const errorMessage =
          'Failed to load the default editor, reason: default editor ID is not provided by Che server.';
        dispatch({
          type: 'RECEIVE_DW_DEFAULT_EDITOR_ERROR',
          error: errorMessage,
        });
        throw errorMessage;
      }

      const defaultEditorUrl = defaultEditor.startsWith('https://')
        ? defaultEditor
        : `${settings.cheWorkspacePluginRegistryUrl}/plugins/${defaultEditor}/devfile.yaml`;

      // request default editor
      await dispatch(actionCreators.requestDwEditor(settings, defaultEditor));

      dispatch({
        type: 'RECEIVE_DW_DEFAULT_EDITOR',
        defaultEditorName: defaultEditor,
        url: defaultEditorUrl,
      });
    },
};

const unloadedState: State = {
  isLoading: false,
  plugins: {},
  editors: {},
  defaultEditorName: undefined,
};

export const reducer: Reducer<State> = (
  state: State | undefined,
  incomingAction: Action,
): State => {
  if (state === undefined) {
    return unloadedState;
  }

  const action = incomingAction as KnownAction;
  switch (action.type) {
    case 'REQUEST_DW_PLUGIN':
      return createObject(state, {
        isLoading: true,
        plugins: {
          [action.url]: {
            // only keep the plugin and get rid of an error
            plugin: state.plugins[action.url]?.plugin,
            url: action.url,
          },
        },
      });
    case 'REQUEST_DW_EDITOR':
      return createObject(state, {
        isLoading: true,
        editors: createObject(state.editors, {
          [action.editorName]: {
            plugin: undefined,
            url: action.url,
          },
        }),
      });
    case 'REQUEST_DW_DEFAULT_EDITOR':
      return createObject(state, {
        isLoading: true,
        defaultEditorName: undefined,
        defaultEditorError: undefined,
      });
    case 'RECEIVE_DW_PLUGIN':
      return createObject(state, {
        isLoading: false,
        plugins: {
          [action.url]: {
            plugin: action.plugin,
            url: action.url,
          },
        },
      });
    case 'RECEIVE_DW_EDITOR':
      return createObject(state, {
        isLoading: false,
        editors: createObject(state.editors, {
          [action.editorName]: {
            plugin: action.plugin,
            url: action.url,
          },
        }),
      });
    case 'RECEIVE_DW_EDITOR_ERROR':
      return createObject(state, {
        isLoading: false,
        editors: {
          [action.editorName]: {
            error: action.error,
            url: action.url,
          },
        },
      });

    case 'RECEIVE_DW_PLUGIN_ERROR':
      return createObject(state, {
        isLoading: false,
        plugins: {
          [action.url]: {
            // save the error and keep the plugin
            url: action.url,
            error: action.error,
            plugin: state.plugins[action.url]?.plugin,
          },
        },
      });
    case 'RECEIVE_DW_DEFAULT_EDITOR_ERROR':
      return createObject(state, {
        isLoading: false,
        defaultEditorError: action.error,
      });
    case 'RECEIVE_DW_DEFAULT_EDITOR':
      return createObject(state, {
        isLoading: false,
        defaultEditorName: action.defaultEditorName,
      });
    default:
      return state;
  }
};
