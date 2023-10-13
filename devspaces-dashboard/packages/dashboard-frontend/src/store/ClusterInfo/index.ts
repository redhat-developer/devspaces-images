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

import common, { ClusterInfo } from '@eclipse-che/common';
import { Action, Reducer } from 'redux';

import { fetchClusterInfo } from '@/services/backend-client/clusterInfoApi';
import { createObject } from '@/store/helpers';
import { AUTHORIZED, SanityCheckAction } from '@/store/sanityCheckMiddleware';

import { AppThunk } from '..';

export interface State {
  isLoading: boolean;
  clusterInfo: ClusterInfo;
  error?: string;
}

export enum Type {
  REQUEST_CLUSTER_INFO = 'REQUEST_CLUSTER_INFO',
  RECEIVE_CLUSTER_INFO = 'RECEIVE_CLUSTER_INFO',
  RECEIVE_CLUSTER_INFO_ERROR = 'RECEIVE_CLUSTER_INFO_ERROR',
}

export interface RequestClusterInfoAction extends Action, SanityCheckAction {
  type: Type.REQUEST_CLUSTER_INFO;
}

export interface ReceiveClusterInfoAction {
  type: Type.RECEIVE_CLUSTER_INFO;
  clusterInfo: ClusterInfo;
}

export interface ReceivedClusterInfoErrorAction {
  type: Type.RECEIVE_CLUSTER_INFO_ERROR;
  error: string;
}

export type KnownAction =
  | RequestClusterInfoAction
  | ReceiveClusterInfoAction
  | ReceivedClusterInfoErrorAction;

export type ActionCreators = {
  requestClusterInfo: () => AppThunk<KnownAction, Promise<void>>;
};

export const actionCreators: ActionCreators = {
  requestClusterInfo:
    (): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      await dispatch({
        type: Type.REQUEST_CLUSTER_INFO,
        check: AUTHORIZED,
      });

      try {
        const clusterInfo = await fetchClusterInfo();
        dispatch({
          type: Type.RECEIVE_CLUSTER_INFO,
          clusterInfo,
        });
      } catch (e) {
        const errorMessage =
          'Failed to fetch cluster properties, reason: ' + common.helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_CLUSTER_INFO_ERROR,
          error: errorMessage,
        });
        throw errorMessage;
      }
    },
};

const unloadedState: State = {
  isLoading: false,
  clusterInfo: {
    applications: [],
  },
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
    case Type.REQUEST_CLUSTER_INFO:
      return createObject<State>(state, {
        isLoading: true,
        error: undefined,
      });
    case Type.RECEIVE_CLUSTER_INFO:
      return createObject<State>(state, {
        isLoading: false,
        clusterInfo: action.clusterInfo,
      });
    case Type.RECEIVE_CLUSTER_INFO_ERROR:
      return createObject<State>(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};
