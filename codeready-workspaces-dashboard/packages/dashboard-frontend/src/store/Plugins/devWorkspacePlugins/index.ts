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

import { IDevWorkspaceDevfile } from '@eclipse-che/devworkspace-client';
import { safeLoad } from 'js-yaml';
import { Action, Reducer } from 'redux';
import { AppThunk } from '../..';
import { fetchDevfile, fetchData } from '../../../services/registry/devfiles';
import { createObject } from '../../helpers';

export interface State {
  isLoading: boolean;
  plugins: {
    [url: string]: {
      plugin?: IDevWorkspaceDevfile;
      error?: string;
    };
  };

  defaultEditorError?: string;
}

export interface RequestDwPluginAction {
  type: 'REQUEST_DW_PLUGIN';
  url: string;
}

export interface ReceiveDwPluginAction {
  type: 'RECEIVE_DW_PLUGIN';
  url: string;
  plugin: IDevWorkspaceDevfile;
}

export interface ReceiveDwPluginErrorAction {
  type: 'RECEIVE_DW_PLUGIN_ERROR';
  url: string;
  error: string;
}

export interface RequestDwDefaultEditorAction {
  type: 'REQUEST_DW_DEFAULT_EDITOR';
}

export interface ReceiveDwDefaultEditorErrorAction {
  type: 'RECEIVE_DW_DEFAULT_EDITOR_ERROR';
  error: string;
}

export type KnownAction = RequestDwPluginAction
  | ReceiveDwPluginAction
  | ReceiveDwPluginErrorAction
  | RequestDwDefaultEditorAction
  | ReceiveDwDefaultEditorErrorAction;

export type ActionCreators = {
  requestDwDevfiles: (url: string) => AppThunk<KnownAction, Promise<void>>;
  requestDwDefaultEditor: (settings: che.WorkspaceSettings) => AppThunk<KnownAction, Promise<void>>;
}

export const actionCreators: ActionCreators = {

  requestDwDevfiles: (url: string): AppThunk<KnownAction, Promise<void>> => async (dispatch): Promise<void> => {
    dispatch({
      type: 'REQUEST_DW_PLUGIN',
      url,
    });

    try {
      const pluginContent = await fetchDevfile(url);
      const plugin = safeLoad(pluginContent) as IDevWorkspaceDevfile;
      dispatch({
        type: 'RECEIVE_DW_PLUGIN',
        url,
        plugin,
      });
    } catch (error) {
      dispatch({
        type: 'RECEIVE_DW_PLUGIN_ERROR',
        url,
        error,
      });
      throw error;
    }
  },

  requestDwDefaultEditor: (settings: che.WorkspaceSettings): AppThunk<KnownAction, Promise<void>> => async (dispatch): Promise<void> => {
    const pluginRegistryUrl = settings.cheWorkspacePluginRegistryUrl;
    const defaultEditor = settings['che.factory.default_editor'];

    if (!pluginRegistryUrl || !defaultEditor) {
      const errorMessage = 'Failed to load the default editor, reason: plugin registry URL or default editor ID is not provided by Che server.';
      dispatch({
        type: 'RECEIVE_DW_DEFAULT_EDITOR_ERROR',
        error: errorMessage,
      });
      throw errorMessage;
    }

    const defaultEditorUrl = `${settings.cheWorkspacePluginRegistryUrl}/plugins/${settings['che.factory.default_editor']}/devfile.yaml`;

    dispatch({
      type: 'REQUEST_DW_PLUGIN',
      url: defaultEditorUrl,
    });
    dispatch({
      type: 'REQUEST_DW_DEFAULT_EDITOR',
    });
    try {
      const pluginContent = await fetchData<string>(defaultEditorUrl);
      const plugin = safeLoad(pluginContent) as IDevWorkspaceDevfile;
      dispatch({
        type: 'RECEIVE_DW_PLUGIN',
        url: defaultEditorUrl,
        plugin,
      });
    } catch (error) {
      const errorMessage = `Failed to load the default editor, reason: "${defaultEditorUrl}" responds "${error}".`;
      dispatch({
        type: 'RECEIVE_DW_PLUGIN_ERROR',
        url: defaultEditorUrl,
        error: errorMessage,
      });
      dispatch({
        type: 'RECEIVE_DW_DEFAULT_EDITOR_ERROR',
        error: errorMessage,
      });
      throw errorMessage;
    }
  },

};

const unloadedState: State = {
  isLoading: false,
  plugins: {},
};

export const reducer: Reducer<State> = (state: State | undefined, incomingAction: Action): State => {
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
          }
        },
      });
    case 'REQUEST_DW_DEFAULT_EDITOR':
      return createObject(state, {
        isLoading: true,
        defaultEditorError: undefined,
      });
    case 'RECEIVE_DW_PLUGIN':
      return createObject(state, {
        isLoading: false,
        plugins: {
          [action.url]: {
            plugin: action.plugin,
          }
        }
      });
    case 'RECEIVE_DW_PLUGIN_ERROR':
      return createObject(state, {
        isLoading: false,
        plugins: {
          [action.url]: {
            // save the error and keep the plugin
            error: action.error,
            plugin: state.plugins[action.url]?.plugin,
          }
        }
      });
    case 'RECEIVE_DW_DEFAULT_EDITOR_ERROR':
      return createObject(state, {
        isLoading: false,
        defaultEditorError: action.error,
      });
    default:
      return state;
  }
};
