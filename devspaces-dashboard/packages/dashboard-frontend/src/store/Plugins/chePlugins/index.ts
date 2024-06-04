/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
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
import { Action, Reducer } from 'redux';

import { che } from '@/services/models';
import { AppThunk } from '@/store';
import { createObject } from '@/store/helpers';
import * as devWorkspacePlugins from '@/store/Plugins/devWorkspacePlugins';
import { SanityCheckAction } from '@/store/sanityCheckMiddleware';

export const EXCLUDED_TARGET_EDITOR_NAMES = [''];

export interface State {
  isLoading: boolean;
  plugins: che.Plugin[];
  error?: string;
}

interface RequestPluginsAction extends Action, SanityCheckAction {
  type: 'REQUEST_PLUGINS';
}

interface ReceivePluginsAction {
  type: 'RECEIVE_PLUGINS';
  plugins: che.Plugin[];
}

interface ReceivePluginsErrorAction {
  type: 'RECEIVE_PLUGINS_ERROR';
  error: string;
}

type KnownAction = RequestPluginsAction | ReceivePluginsAction | ReceivePluginsErrorAction;

export type ActionCreators = {
  requestPlugins: () => AppThunk<KnownAction, Promise<void>>;
};

export const actionCreators: ActionCreators = {
  requestPlugins:
    (): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      try {
        // request editors from config map
        await dispatch(devWorkspacePlugins.actionCreators.requestEditors());

        const state = getState();
        const editors = state.dwPlugins.cmEditors || [];
        const editorsPlugins: che.Plugin[] = editors.map(editor => {
          return {
            id:
              editor.metadata.attributes.publisher +
              '/' +
              editor.metadata.name +
              '/' +
              editor.metadata.attributes.version,
            name: editor.metadata.name,
            description: editor.metadata.description,
            displayName: editor.metadata.displayName,
            publisher: editor.metadata.attributes.publisher,
            type: 'Che Editor',
            tags: editor.metadata.attributes.tags,
            version: editor.metadata.attributes.version,
            links: {
              devfile: '',
            },
            icon: editor.metadata.attributes.iconData,
            iconMediatype: editor.metadata.attributes.iconMediatype,
          };
        });
        dispatch({
          type: 'RECEIVE_PLUGINS',
          plugins: editorsPlugins,
        });
      } catch (e) {
        const errorMessage = common.helpers.errors.getMessage(e);
        dispatch({
          type: 'RECEIVE_PLUGINS_ERROR',
          error: errorMessage,
        });
        throw errorMessage;
      }
    },
};

const unloadedState: State = {
  isLoading: false,
  plugins: [],
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
    case 'REQUEST_PLUGINS':
      return createObject<State>(state, {
        isLoading: true,
        error: undefined,
      });
    case 'RECEIVE_PLUGINS':
      return createObject<State>(state, {
        isLoading: false,
        plugins: action.plugins,
      });
    case 'RECEIVE_PLUGINS_ERROR':
      return createObject<State>(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};

/**
 * Because the `baseUrl` ends with '/v3/' and the `link` starts with '/v3/',
 * the `resolveLink` function will remove the duplicate '/v3/' from the `resolved` URL.
 */
export function resolveLink(baseUrl: string, link: string): string {
  const resolved = baseUrl + link;

  const regexSingle = /(\/v\d)/i;
  const regexDuplicate = new RegExp(regexSingle.source + '\\1', regexSingle.flags);

  if (regexDuplicate.test(resolved)) {
    return resolved.replace(regexSingle, '');
  }

  return resolved;
}
