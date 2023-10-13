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

// This state defines the type of data maintained in the Redux store.

import common, { api } from '@eclipse-che/common';
import { Action, Reducer } from 'redux';

import { fetchUserProfile } from '@/services/backend-client/userProfileApi';
import { createObject } from '@/store/helpers';
import { AppThunk } from '@/store/index';
import { selectAsyncIsAuthorized, selectSanityCheckError } from '@/store/SanityCheck/selectors';
import { AUTHORIZED, SanityCheckAction } from '@/store/sanityCheckMiddleware';

export interface State {
  userProfile: api.IUserProfile;
  error?: string;
  isLoading: boolean;
}

export enum Type {
  REQUEST_USER_PROFILE = 'REQUEST_USER_PROFILE',
  RECEIVE_USER_PROFILE = 'RECEIVE_USER_PROFILE',
  RECEIVE_USER_PROFILE_ERROR = 'RECEIVE_USER_PROFILE_ERROR',
}

export interface RequestUserProfileAction extends Action, SanityCheckAction {
  type: Type.REQUEST_USER_PROFILE;
}

export interface ReceiveUserProfileAction {
  type: Type.RECEIVE_USER_PROFILE;
  userProfile: api.IUserProfile;
}

export interface ReceiveUserProfileErrorAction {
  type: Type.RECEIVE_USER_PROFILE_ERROR;
  error: string;
}

export type KnownAction =
  | RequestUserProfileAction
  | ReceiveUserProfileAction
  | ReceiveUserProfileErrorAction;

export type ActionCreators = {
  requestUserProfile: (namespace: string) => AppThunk<KnownAction, Promise<void>>;
};

export const actionCreators: ActionCreators = {
  requestUserProfile:
    (namespace: string): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      try {
        await dispatch({ type: Type.REQUEST_USER_PROFILE, check: AUTHORIZED });
        if (!(await selectAsyncIsAuthorized(getState()))) {
          const error = selectSanityCheckError(getState());
          throw new Error(error);
        }
        const userProfile = await fetchUserProfile(namespace);
        dispatch({
          type: Type.RECEIVE_USER_PROFILE,
          userProfile,
        });
      } catch (e) {
        const errorMessage = common.helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_USER_PROFILE_ERROR,
          error: errorMessage,
        });
        if (common.helpers.errors.isError(e)) {
          throw e;
        }
        throw new Error(errorMessage);
      }
    },
};

const unloadedState: State = {
  userProfile: {
    email: '',
    username: 'unknown',
  },
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
    case Type.REQUEST_USER_PROFILE:
      return createObject<State>(state, {
        isLoading: true,
        error: undefined,
      });
    case Type.RECEIVE_USER_PROFILE:
      return createObject<State>(state, {
        isLoading: false,
        userProfile: action.userProfile,
      });
    case Type.RECEIVE_USER_PROFILE_ERROR:
      return createObject<State>(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};
