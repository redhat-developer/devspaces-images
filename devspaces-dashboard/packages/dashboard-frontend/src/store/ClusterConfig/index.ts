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
import common, { ClusterConfig } from '@eclipse-che/common';
import { AppThunk } from '..';
import { createObject } from '../helpers';
import * as BannerAlertStore from '../BannerAlert';
import { fetchClusterConfig } from '../../services/dashboard-backend-client/clusterConfigApi';
import { AddBannerAction } from '../BannerAlert';
import { AUTHORIZED, SanityCheckAction } from '../sanityCheckMiddleware';

export interface State {
  isLoading: boolean;
  clusterConfig: ClusterConfig;
  error?: string;
}

export enum Type {
  REQUEST_CLUSTER_CONFIG = 'REQUEST_CLUSTER_CONFIG',
  RECEIVE_CLUSTER_CONFIG = 'RECEIVE_CLUSTER_CONFIG',
  RECEIVE_CLUSTER_CONFIG_ERROR = 'RECEIVE_CLUSTER_CONFIG_ERROR',
}

export interface RequestClusterConfigAction extends Action, SanityCheckAction {
  type: Type.REQUEST_CLUSTER_CONFIG;
}

export interface ReceiveClusterConfigAction {
  type: Type.RECEIVE_CLUSTER_CONFIG;
  clusterConfig: ClusterConfig;
}

export interface ReceivedClusterConfigErrorAction {
  type: Type.RECEIVE_CLUSTER_CONFIG_ERROR;
  error: string;
}

export type KnownAction =
  | RequestClusterConfigAction
  | ReceiveClusterConfigAction
  | ReceivedClusterConfigErrorAction
  | AddBannerAction;

export type ActionCreators = {
  requestClusterConfig: () => AppThunk<KnownAction, Promise<void>>;
};

export const actionCreators: ActionCreators = {
  requestClusterConfig:
    (): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      await dispatch({
        type: Type.REQUEST_CLUSTER_CONFIG,
        check: AUTHORIZED,
      });

      try {
        const clusterConfig = await fetchClusterConfig();
        dispatch({
          type: Type.RECEIVE_CLUSTER_CONFIG,
          clusterConfig,
        });

        if (clusterConfig.dashboardWarning) {
          dispatch(BannerAlertStore.actionCreators.addBanner(clusterConfig.dashboardWarning));
        }
      } catch (e) {
        const errorMessage =
          'Failed to fetch cluster configuration, reason: ' + common.helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_CLUSTER_CONFIG_ERROR,
          error: errorMessage,
        });
        throw errorMessage;
      }
    },
};

const unloadedState: State = {
  isLoading: false,
  clusterConfig: {
    runningWorkspacesLimit: 1,
    allWorkspacesLimit: -1,
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
    case Type.REQUEST_CLUSTER_CONFIG:
      return createObject(state, {
        isLoading: true,
        error: undefined,
      });
    case Type.RECEIVE_CLUSTER_CONFIG:
      return createObject(state, {
        isLoading: false,
        clusterConfig: action.clusterConfig,
      });
    case Type.RECEIVE_CLUSTER_CONFIG_ERROR:
      return createObject(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};
