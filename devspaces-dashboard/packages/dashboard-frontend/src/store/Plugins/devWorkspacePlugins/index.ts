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

import common from '@eclipse-che/common';
import { load } from 'js-yaml';
import { Action, Reducer } from 'redux';

import devfileApi from '@/services/devfileApi';
import { fetchDevfile } from '@/services/registry/devfiles';
import { fetchData } from '@/services/registry/fetchData';
import { AppThunk } from '@/store';
import { createObject } from '@/store/helpers';
import { AUTHORIZED, SanityCheckAction } from '@/store/sanityCheckMiddleware';
import { selectPluginRegistryUrl } from '@/store/ServerConfig/selectors';

export interface PluginDefinition {
  plugin?: devfileApi.Devfile;
  url: string;
  error?: string;
}

export interface WorkspacesDefaultPlugins {
  [editorName: string]: string[];
}

export interface State {
  isLoading: boolean;
  plugins: {
    [url: string]: PluginDefinition;
  };
  editors: {
    [editorName: string]: PluginDefinition;
  };
  defaultPlugins: WorkspacesDefaultPlugins;
  defaultEditorName?: string;
  defaultEditorError?: string;
}

export interface RequestDwDefaultEditorAction extends Action, SanityCheckAction {
  type: 'REQUEST_DW_DEFAULT_EDITOR';
}

export interface RequestDwPluginAction extends Action, SanityCheckAction {
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

export interface RequestDwEditorAction extends Action, SanityCheckAction {
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

export interface RequestDwDefaultPluginsAction extends Action, SanityCheckAction {
  type: 'REQUEST_DW_DEFAULT_PLUGINS';
}

export interface ReceiveDwDefaultPluginsAction {
  type: 'RECEIVE_DW_DEFAULT_PLUGINS';
  defaultPlugins: WorkspacesDefaultPlugins;
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
  | RequestDwEditorErrorAction
  | RequestDwDefaultPluginsAction
  | ReceiveDwDefaultPluginsAction;

export type ActionCreators = {
  requestDwDevfile: (url: string) => AppThunk<KnownAction, Promise<void>>;
  requestDwDefaultEditor: () => AppThunk<KnownAction, Promise<void>>;
  requestDwDefaultPlugins: () => AppThunk<KnownAction, Promise<void>>;
  requestDwEditor: (editorName: string) => AppThunk<KnownAction, Promise<void>>;
};
export const actionCreators: ActionCreators = {
  requestDwDevfile:
    (url: string): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      dispatch({
        type: 'REQUEST_DW_PLUGIN',
        check: AUTHORIZED,
        url,
      });

      try {
        const pluginContent = await fetchDevfile(url);
        const plugin = load(pluginContent) as devfileApi.Devfile;
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
    (editorName: string): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      let editorUrl;
      // check if the editor is an id or a path to a given editor
      if (editorName.startsWith('https://')) {
        editorUrl = editorName;
      } else {
        const pluginRegistryUrl = selectPluginRegistryUrl(getState());
        editorUrl = `${pluginRegistryUrl}/plugins/${editorName}/devfile.yaml`;

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
          check: AUTHORIZED,
          url: editorUrl,
          editorName,
        });
        const pluginContent = await fetchData<string>(editorUrl);
        const plugin = load(pluginContent) as devfileApi.Devfile;
        dispatch({
          type: 'RECEIVE_DW_EDITOR',
          editorName,
          url: editorUrl,
          plugin,
        });
      } catch (error) {
        const errorMessage = `Failed to load the editor ${editorName}. Invalid devfile. Check 'che-editor' param.`;
        dispatch({
          type: 'RECEIVE_DW_EDITOR_ERROR',
          url: editorUrl,
          editorName,
          error: errorMessage,
        });
        throw common.helpers.errors.getMessage(error);
      }
    },

  requestDwDefaultEditor:
    (): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      const config = getState().dwServerConfig.config;
      const defaultEditor = config.defaults.editor;
      dispatch({
        type: 'REQUEST_DW_DEFAULT_EDITOR',
        check: AUTHORIZED,
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

      const pluginRegistryURL = selectPluginRegistryUrl(getState());
      const defaultEditorUrl = (defaultEditor as string).startsWith('https://')
        ? defaultEditor
        : `${pluginRegistryURL}/plugins/${defaultEditor}/devfile.yaml`;

      // request default editor
      await dispatch(actionCreators.requestDwEditor(defaultEditor));

      dispatch({
        type: 'RECEIVE_DW_DEFAULT_EDITOR',
        defaultEditorName: defaultEditor,
        url: defaultEditorUrl,
      });
    },

  requestDwDefaultPlugins:
    (): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      dispatch({
        type: 'REQUEST_DW_DEFAULT_PLUGINS',
        check: AUTHORIZED,
      });

      const defaultPlugins = {};
      const defaults = getState().dwServerConfig.config.defaults;
      (defaults.plugins || []).forEach(item => {
        if (!defaultPlugins[item.editor]) {
          defaultPlugins[item.editor] = [];
        }
        defaultPlugins[item.editor].push(...item.plugins);
      });

      dispatch({
        type: 'RECEIVE_DW_DEFAULT_PLUGINS',
        defaultPlugins,
      });
    },
};

const unloadedState: State = {
  isLoading: false,
  plugins: {},
  editors: {},
  defaultPlugins: {},
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
      return createObject<State>(state, {
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
      return createObject<State>(state, {
        isLoading: true,
        editors: createObject(state.editors, {
          [action.editorName]: {
            plugin: undefined,
            url: action.url,
          },
        }),
      });
    case 'REQUEST_DW_DEFAULT_EDITOR':
      return createObject<State>(state, {
        isLoading: true,
        defaultEditorName: undefined,
        defaultEditorError: undefined,
      });
    case 'RECEIVE_DW_PLUGIN':
      return createObject<State>(state, {
        isLoading: false,
        plugins: {
          [action.url]: {
            plugin: action.plugin,
            url: action.url,
          },
        },
      });
    case 'RECEIVE_DW_EDITOR':
      return createObject<State>(state, {
        isLoading: false,
        editors: createObject(state.editors, {
          [action.editorName]: {
            plugin: action.plugin,
            url: action.url,
          },
        }),
      });
    case 'RECEIVE_DW_EDITOR_ERROR':
      return createObject<State>(state, {
        isLoading: false,
        editors: {
          [action.editorName]: {
            error: action.error,
            url: action.url,
          },
        },
      });

    case 'RECEIVE_DW_PLUGIN_ERROR':
      return createObject<State>(state, {
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
      return createObject<State>(state, {
        isLoading: false,
        defaultEditorError: action.error,
      });
    case 'RECEIVE_DW_DEFAULT_EDITOR':
      return createObject<State>(state, {
        isLoading: false,
        defaultEditorName: action.defaultEditorName,
      });
    case 'REQUEST_DW_DEFAULT_PLUGINS':
      return createObject<State>(state, {
        isLoading: true,
      });
    case 'RECEIVE_DW_DEFAULT_PLUGINS':
      return createObject<State>(state, {
        isLoading: false,
        defaultPlugins: action.defaultPlugins,
      });
    default:
      return state;
  }
};
