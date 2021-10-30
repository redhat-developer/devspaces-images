/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
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
import common, { ApplicationInfo } from '@eclipse-che/common';
import { AppThunk } from '..';
import { createObject } from '../helpers';
import { fetchClusterInfo } from '../../services/dashboard-backend-client/clusterInfo';

export interface State {
  isLoading: boolean;
  applications: ApplicationInfo[];
  error?: string;
}

export enum Type {
  REQUEST_APP_INFO = 'REQUEST_APP_INFO',
  RECEIVE_APP_INFO = 'RECEIVE_APP_INFO',
  RECEIVE_APP_INFO_ERROR = 'RECEIVE_APP_INFO_ERROR',
}

export interface RequestAppInfoAction {
  type: Type.REQUEST_APP_INFO;
}

export interface ReceiveAppInfoAction {
  type: Type.RECEIVE_APP_INFO;
  appInfo: ApplicationInfo;
}

export interface ReceivedAppInfoErrorAction {
  type: Type.RECEIVE_APP_INFO_ERROR;
  error: string;
}

export type KnownAction =
  RequestAppInfoAction
  | ReceiveAppInfoAction
  | ReceivedAppInfoErrorAction;

export type ActionCreators = {
  requestClusterInfo: () => AppThunk<KnownAction, Promise<void>>;
};

export const actionCreators: ActionCreators = {

  requestClusterInfo: (): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      dispatch({
        type: Type.REQUEST_APP_INFO,
      });

      try {
        const appInfo = await fetchClusterInfo();
        dispatch({
          type: Type.RECEIVE_APP_INFO,
          appInfo,
        });
      } catch (e) {
        const errorMessage = 'Failed to fetch cluster properties, reason: ' + common.helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_APP_INFO_ERROR,
          error: errorMessage,
        });
        throw errorMessage;
      }
    },

};

const unloadedState: State = {
  isLoading: false,
  applications: [],
};

export const reducer: Reducer<State> = (state: State | undefined, incomingAction: Action): State => {
  if (state === undefined) {
    return unloadedState;
  }

  const action = incomingAction as KnownAction;
  switch (action.type) {
    case Type.REQUEST_APP_INFO:
      return createObject(state, {
        isLoading: true,
        error: undefined,
      });
    case Type.RECEIVE_APP_INFO:
      return createObject(state, {
        isLoading: false,
        applications: state.applications
          .filter(appInfo => appInfo.title !== action.appInfo.title)
          .concat([action.appInfo]),
      });
    case Type.RECEIVE_APP_INFO_ERROR:
      return createObject(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};
