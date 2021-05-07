/*
 * Copyright (c) 2018-2020 Red Hat, Inc.
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
import { AppThunkAction, AppState } from './';
import { fetchPlugins } from '../services/registry/plugins';

export interface State {
  isLoading: boolean;
  plugins: che.Plugin[];
}

interface RequestPluginsAction {
  type: 'REQUEST_PLUGINS';
}

interface ReceivePluginsAction {
  type: 'RECEIVE_PLUGINS';
  plugins: che.Plugin[];
}

type KnownAction = RequestPluginsAction
  | ReceivePluginsAction;

// todo proper type instead of 'any'
export type ActionCreators = {
  requestPlugins: (registryUrl: string) => any;
};

export const actionCreators: ActionCreators = {

  requestPlugins: (registryUrl: string): AppThunkAction<KnownAction> => async (dispatch, getState): Promise<che.Plugin[]> => {
    const appState: AppState = getState();
    if (!appState || !appState.infrastructureNamespace) {
      // todo throw a nice error
      throw Error('something unexpected happened');
    }

    dispatch({ type: 'REQUEST_PLUGINS' });

    try {
      const plugins = await fetchPlugins(registryUrl);
      dispatch({ type: 'RECEIVE_PLUGINS', plugins });
      return plugins;
    } catch (e) {
      throw new Error('Failed to request plugins, \n' + e);
    }
  },

};

const unloadedState: State = {
  isLoading: false,
  plugins: [],
};

export const reducer: Reducer<State> = (state: State | undefined, incomingAction: Action): State => {
  if (state === undefined) {
    return unloadedState;
  }

  const action = incomingAction as KnownAction;
  switch (action.type) {
    case 'REQUEST_PLUGINS':
      return Object.assign({}, state, {
        isLoading: true,
      });
    case 'RECEIVE_PLUGINS':
      return Object.assign({}, state, {
        plugins: action.plugins,
      });
    default:
      return state;
  }
};
