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

import common, { api } from '@eclipse-che/common';
import { Action, Reducer } from 'redux';

import * as ServerConfigApi from '@/services/backend-client/serverConfigApi';
import { AppThunk } from '@/store';
import { createObject } from '@/store/helpers';

export interface State {
  isLoading: boolean;
  config: api.IServerConfig;
  error?: string;
}

export interface RequestDwServerConfigAction {
  type: 'REQUEST_DW_SERVER_CONFIG';
}

export interface ReceiveDwServerConfigAction {
  type: 'RECEIVE_DW_SERVER_CONFIG';
  config: api.IServerConfig;
}

export interface ReceiveDwServerConfigErrorAction {
  type: 'RECEIVE_DW_SERVER_CONFIG_ERROR';
  error: string;
}

export type KnownAction =
  | ReceiveDwServerConfigAction
  | ReceiveDwServerConfigErrorAction
  | RequestDwServerConfigAction;

export type ActionCreators = {
  requestServerConfig: () => AppThunk<KnownAction, Promise<void>>;
};
export const actionCreators: ActionCreators = {
  requestServerConfig:
    (): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      dispatch({ type: 'REQUEST_DW_SERVER_CONFIG' });
      try {
        const config = await ServerConfigApi.fetchServerConfig();
        dispatch({
          type: 'RECEIVE_DW_SERVER_CONFIG',
          config,
        });
      } catch (e) {
        const error = common.helpers.errors.getMessage(e);
        dispatch({
          type: 'RECEIVE_DW_SERVER_CONFIG_ERROR',
          error,
        });
        throw new Error(`Failed to fetch workspace defaults. ${error}`);
      }
    },
};

const unloadedState: State = {
  isLoading: false,
  config: {
    containerBuild: {},
    defaults: {
      editor: undefined,
      components: [],
      plugins: [],
      pvcStrategy: '',
    },
    devfileRegistry: {
      disableInternalRegistry: false,
      externalDevfileRegistries: [],
    },
    pluginRegistry: {
      openVSXURL: '',
    },
    timeouts: {
      inactivityTimeout: -1,
      runTimeout: -1,
      startTimeout: 300,
    },
    defaultNamespace: {
      autoProvision: true,
    },
    cheNamespace: '',
    pluginRegistryURL: '',
    pluginRegistryInternalURL: '',
    allowedSourceUrls: [],
  },
  error: undefined,
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
    case 'REQUEST_DW_SERVER_CONFIG':
      return createObject<State>(state, {
        isLoading: true,
      });
    case 'RECEIVE_DW_SERVER_CONFIG':
      return createObject<State>(state, {
        isLoading: false,
        config: action.config,
        error: undefined,
      });
    case 'RECEIVE_DW_SERVER_CONFIG_ERROR':
      return createObject<State>(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};
