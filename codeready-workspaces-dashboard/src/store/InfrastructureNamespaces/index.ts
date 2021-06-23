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
import { container } from '../../inversify.config';
import { CheWorkspaceClient } from '../../services/workspace-client/cheWorkspaceClient';
import { AppThunk } from '..';
import { getErrorMessage } from '../../services/helpers/getErrorMessage';
import { createState } from '../helpers';

const WorkspaceClient = container.get(CheWorkspaceClient);

export interface State {
  isLoading: boolean;
  namespaces: che.KubernetesNamespace[];
  error?: string;
}

interface RequestNamespacesAction {
  type: 'REQUEST_NAMESPACES';
}

interface ReceiveNamespacesAction {
  type: 'RECEIVE_NAMESPACES';
  namespaces: che.KubernetesNamespace[];
}

interface ReceiveNamespacesErrorAction {
  type: 'RECEIVE_NAMESPACES_ERROR';
  error: string;
}

type KnownAction = RequestNamespacesAction
  | ReceiveNamespacesAction
  | ReceiveNamespacesErrorAction;

export type ActionCreators = {
  requestNamespaces: () => AppThunk<KnownAction, Promise<Array<che.KubernetesNamespace>>>;
};

export const actionCreators: ActionCreators = {

  requestNamespaces: (): AppThunk<KnownAction, Promise<Array<che.KubernetesNamespace>>> => async (dispatch): Promise<Array<che.KubernetesNamespace>> => {
    dispatch({ type: 'REQUEST_NAMESPACES' });

    try {
      const namespaces = await WorkspaceClient.restApiClient.getKubernetesNamespace<Array<che.KubernetesNamespace>>();
      dispatch({
        type: 'RECEIVE_NAMESPACES',
        namespaces,
      });
      return namespaces;
    } catch (e) {
      const errorMessage = 'Failed to fetch list of available kubernetes namespaces, reason: ' + getErrorMessage(e);
      dispatch({
        type: 'RECEIVE_NAMESPACES_ERROR',
        error: errorMessage,
      });
      throw errorMessage;
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
      return createState(state, {
        isLoading: true,
        error: undefined,
      });
    case 'RECEIVE_NAMESPACES':
      return createState(state, {
        isLoading: false,
        namespaces: action.namespaces,
      });
    case 'RECEIVE_NAMESPACES_ERROR':
      return createState(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};
