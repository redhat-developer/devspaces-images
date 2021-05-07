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
import { container } from '../inversify.config';
import { CheWorkspaceClient } from '../services/workspace-client/cheWorkspaceClient';
import { AppThunk } from './';

const WorkspaceClient = container.get(CheWorkspaceClient);

export interface State {
  isLoading: boolean;
  namespaces: che.KubernetesNamespace[];
}

interface RequestNamespacesAction {
  type: 'REQUEST_NAMESPACES';
}

interface ReceiveNamespacesAction {
  type: 'RECEIVE_NAMESPACES';
  namespaces: che.KubernetesNamespace[];
}

type KnownAction = RequestNamespacesAction
  | ReceiveNamespacesAction;

export type ActionCreators = {
  requestNamespaces: () => AppThunk<KnownAction, Promise<Array<che.KubernetesNamespace>>>;
};

export const actionCreators: ActionCreators = {

  requestNamespaces: (): AppThunk<KnownAction, Promise<Array<che.KubernetesNamespace>>> => async (dispatch): Promise<Array<che.KubernetesNamespace>> => {
    dispatch({ type: 'REQUEST_NAMESPACES' });

    try {
      const namespaces = await WorkspaceClient.restApiClient.getKubernetesNamespace<Array<che.KubernetesNamespace>>();
      dispatch({ type: 'RECEIVE_NAMESPACES', namespaces });
      return namespaces;
    } catch (e) {
      throw new Error('Failed to request list of available kubernetes namespaces, \n' + e);
    }
  },

};

const unloadedState: State = {
  isLoading: false,
  namespaces: [],
};

export const reducer: Reducer<State> = (state: State | undefined, incomingAction: Action): State => {
  if (state === undefined) {
    return unloadedState;
  }

  const action = incomingAction as KnownAction;
  switch (action.type) {
    case 'REQUEST_NAMESPACES':
      return Object.assign({}, state, {
        isLoading: true,
      });
    case 'RECEIVE_NAMESPACES':
      return Object.assign({}, state, {
        namespaces: action.namespaces,
      });
    default:
      return state;
  }
};
