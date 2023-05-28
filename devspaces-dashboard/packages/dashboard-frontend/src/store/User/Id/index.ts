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
import { fetchCheUserId } from '../../../services/che-user-id';
import { createObject } from '../../helpers';
import { AppThunk } from '../../index';
import { AUTHORIZED, SanityCheckAction } from '../../sanityCheckMiddleware';

export interface State {
  cheUserId: string;
  error?: string;
  isLoading: boolean;
}

export enum Type {
  REQUEST_CHE_USER_ID = 'REQUEST_CHE_USER_ID',
  RECEIVE_CHE_USER_ID = 'RECEIVE_CHE_USER_ID',
  RECEIVE_CHE_USER_ID_ERROR = 'RECEIVE_CHE_USER_ID_ERROR',
}

export interface RequestCheUserIdAction extends Action, SanityCheckAction {
  type: Type.REQUEST_CHE_USER_ID;
}

export interface ReceiveCheUserAction {
  type: Type.RECEIVE_CHE_USER_ID;
  cheUserId: string;
}

export interface ReceiveCheUserErrorAction {
  type: Type.RECEIVE_CHE_USER_ID_ERROR;
  error: string;
}

export type KnownAction = RequestCheUserIdAction | ReceiveCheUserAction | ReceiveCheUserErrorAction;

export type ActionCreators = {
  requestCheUserId: () => AppThunk<KnownAction, Promise<void>>;
};

export const actionCreators: ActionCreators = {
  requestCheUserId:
    (): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      await dispatch({ type: Type.REQUEST_CHE_USER_ID, check: AUTHORIZED });

      try {
        const cheUserId = await fetchCheUserId();
        dispatch({
          type: Type.RECEIVE_CHE_USER_ID,
          cheUserId,
        });
      } catch (e) {
        const errorMessage = common.helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_CHE_USER_ID_ERROR,
          error: errorMessage,
        });
        throw e;
      }
    },
};

const unloadedState: State = {
  cheUserId: '',
  isLoading: false,
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
    case Type.REQUEST_CHE_USER_ID:
      return createObject(state, {
        isLoading: true,
        error: undefined,
      });
    case Type.RECEIVE_CHE_USER_ID:
      return createObject(state, {
        isLoading: false,
        cheUserId: action.cheUserId,
      });
    case Type.RECEIVE_CHE_USER_ID_ERROR:
      return createObject(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};
