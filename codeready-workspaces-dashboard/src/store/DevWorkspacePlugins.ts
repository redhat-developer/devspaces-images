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

import { IDevWorkspaceDevfile } from '@eclipse-che/devworkspace-client';
import { safeLoad } from 'js-yaml';
import { Action, Reducer } from 'redux';
import { AppThunk } from '.';
import { fetchDevfile } from '../services/registry/devfiles';

export interface State {
  isLoading: boolean;
  plugins: IDevWorkspaceDevfile[];
}

interface RequestDwPluginAction {
  type: 'REQUEST_DW_PLUGIN';
}

interface ReceiveDwPluginAction {
  type: 'RECEIVE_DW_PLUGIN';
  plugin: IDevWorkspaceDevfile;
}

export type ActionCreators = {
  requestDwDevfiles: (url: string) => AppThunk<RequestDwPluginAction | ReceiveDwPluginAction, Promise<void>>;
}

export const actionCreators: ActionCreators = {

  requestDwDevfiles: (url: string): AppThunk<RequestDwPluginAction | ReceiveDwPluginAction, Promise<void>> => async (dispatch): Promise<void> => {
    dispatch({ type: 'REQUEST_DW_PLUGIN' });

    try {
      const pluginContent = await fetchDevfile(url);
      const plugin = safeLoad(pluginContent);
      dispatch({
        type: 'RECEIVE_DW_PLUGIN',
        plugin,
      });
    } catch (e) {
      throw new Error('Failed to request devworkspace plugin, \n' + e);
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

  const action = incomingAction as RequestDwPluginAction | ReceiveDwPluginAction;
  switch (action.type) {
    case 'REQUEST_DW_PLUGIN':
      return Object.assign({}, state, {
        isLoading: true,
      });
    case 'RECEIVE_DW_PLUGIN':
      return Object.assign({}, state, {
        plugins:
          state.plugins.includes(action.plugin)
            ? state.plugins
            : state.plugins.concat([action.plugin])
      } as State);
    default:
      return state;
  }
};
