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

import axios from 'axios';
import { Action, Reducer } from 'redux';
import common from '@eclipse-che/common';
import { AppThunk } from '../..';
import { createObject } from '../../helpers';
import { AUTHORIZED, SanityCheckAction } from '../../sanityCheckMiddleware';

// create new instance of `axios` to avoid adding an authorization header
const axiosInstance = axios.create();

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
  requestPlugins: (registryUrl: string) => AppThunk<KnownAction, Promise<che.Plugin[]>>;
};

export const actionCreators: ActionCreators = {
  requestPlugins:
    (registryUrl: string): AppThunk<KnownAction, Promise<che.Plugin[]>> =>
    async (dispatch): Promise<che.Plugin[]> => {
      await dispatch({ type: 'REQUEST_PLUGINS', check: AUTHORIZED });

      try {
        const response = await axiosInstance.request<che.Plugin[]>({
          method: 'GET',
          url: `${registryUrl}/plugins/`,
        });
        const plugins = response.data;

        dispatch({
          type: 'RECEIVE_PLUGINS',
          plugins,
        });
        return plugins;
      } catch (e) {
        const errorMessage =
          `Failed to fetch plugins from registry URL: ${registryUrl}, reason: ` +
          common.helpers.errors.getMessage(e);
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
      return createObject(state, {
        isLoading: true,
        error: undefined,
      });
    case 'RECEIVE_PLUGINS':
      return createObject(state, {
        isLoading: false,
        plugins: action.plugins,
      });
    case 'RECEIVE_PLUGINS_ERROR':
      return createObject(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};
