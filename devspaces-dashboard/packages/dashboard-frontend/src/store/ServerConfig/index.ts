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

import { Action, Reducer } from 'redux';
import common, { api } from '@eclipse-che/common';
import { AppThunk } from '../';
import { createObject } from '../helpers';
import * as ServerConfigApi from '../../services/dashboard-backend-client/serverConfigApi';
import { AUTHORIZED, SanityCheckAction } from '../sanityCheckMiddleware';

export interface State {
  isLoading: boolean;
  config: api.IServerConfig;
  error?: string;
}

export interface RequestDwServerConfigAction extends Action, SanityCheckAction {
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
      await dispatch({
        type: 'REQUEST_DW_SERVER_CONFIG',
        check: AUTHORIZED,
      });
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
    cheNamespace: '',
    devfileRegistryURL: '',
    devfileRegistryInternalURL: '',
    pluginRegistryURL: '',
    pluginRegistryInternalURL: '',
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
      return createObject(state, {
        isLoading: true,
      });
    case 'RECEIVE_DW_SERVER_CONFIG':
      return createObject(state, {
        isLoading: false,
        config: action.config,
        error: undefined,
      });
    case 'RECEIVE_DW_SERVER_CONFIG_ERROR':
      return createObject(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};
