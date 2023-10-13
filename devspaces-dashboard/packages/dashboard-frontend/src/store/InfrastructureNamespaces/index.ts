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
import { Action, Reducer } from 'redux';

import { getKubernetesNamespace } from '@/services/backend-client/kubernetesNamespaceApi';
import { createObject } from '@/store/helpers';
import { selectAsyncIsAuthorized, selectSanityCheckError } from '@/store/SanityCheck/selectors';
import { AUTHORIZED, SanityCheckAction } from '@/store/sanityCheckMiddleware';

import { AppThunk } from '..';

export interface State {
  isLoading: boolean;
  namespaces: che.KubernetesNamespace[];
  error?: string;
}

interface RequestNamespacesAction extends Action, SanityCheckAction {
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

type KnownAction = RequestNamespacesAction | ReceiveNamespacesAction | ReceiveNamespacesErrorAction;

export type ActionCreators = {
  requestNamespaces: () => AppThunk<KnownAction, Promise<Array<che.KubernetesNamespace>>>;
};

export const actionCreators: ActionCreators = {
  requestNamespaces:
    (): AppThunk<KnownAction, Promise<Array<che.KubernetesNamespace>>> =>
    async (dispatch, getState): Promise<Array<che.KubernetesNamespace>> => {
      try {
        await dispatch({ type: 'REQUEST_NAMESPACES', check: AUTHORIZED });
        if (!(await selectAsyncIsAuthorized(getState()))) {
          const error = selectSanityCheckError(getState());
          throw new Error(error);
        }
        const namespaces = await getKubernetesNamespace();
        dispatch({
          type: 'RECEIVE_NAMESPACES',
          namespaces,
        });
        return namespaces;
      } catch (e) {
        const errorMessage =
          'Failed to fetch list of available kubernetes namespaces, reason: ' +
          common.helpers.errors.getMessage(e);
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

export const reducer: Reducer<State> = (
  state: State | undefined,
  incomingAction: Action,
): State => {
  if (state === undefined) {
    return unloadedState;
  }

  const action = incomingAction as KnownAction;
  switch (action.type) {
    case 'REQUEST_NAMESPACES':
      return createObject<State>(state, {
        isLoading: true,
        error: undefined,
      });
    case 'RECEIVE_NAMESPACES':
      return createObject<State>(state, {
        isLoading: false,
        namespaces: action.namespaces,
      });
    case 'RECEIVE_NAMESPACES_ERROR':
      return createObject<State>(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};
