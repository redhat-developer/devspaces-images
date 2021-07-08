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

// This state defines the type of data maintained in the Redux store.

import { Action, Reducer } from 'redux';
import { createState } from '../helpers';
import { AppThunk } from '../index';
import { container } from '../../inversify.config';
import { CheWorkspaceClient } from '../../services/workspace-client/cheWorkspaceClient';
import { getErrorMessage } from '../../services/helpers/getErrorMessage';

const WorkspaceClient = container.get(CheWorkspaceClient);

export interface State {
  profile: api.che.user.Profile | undefined;
  error?: string;
  isLoading: boolean;
}

interface RequestUserProfileAction {
  type: 'REQUEST_USER_PROFILE';
}

interface ReceiveUserProfileAction {
  type: 'RECEIVE_USER_PROFILE';
  profile: api.che.user.Profile;
}

interface ReceiveUserProfileErrorAction {
  type: 'RECEIVE_USER_PROFILE_ERROR';
  error: string;
}

type KnownAction = RequestUserProfileAction
  | ReceiveUserProfileAction
  | ReceiveUserProfileErrorAction;

export type ActionCreators = {
  requestUserProfile: () => AppThunk<KnownAction, Promise<void>>;
};

export const actionCreators: ActionCreators = {
  requestUserProfile: (): AppThunk<KnownAction, Promise<void>> => async (dispatch): Promise<void> => {
    dispatch({ type: 'REQUEST_USER_PROFILE' });

    try {
      const profile = await WorkspaceClient.restApiClient.getCurrentUserProfile();
      dispatch({
        type: 'RECEIVE_USER_PROFILE',
        profile,
      });
    } catch (e) {
      const errorMessage = 'Failed to fetch the user profile, reason: ' + getErrorMessage(e);
      dispatch({
        type: 'RECEIVE_USER_PROFILE_ERROR',
        error: errorMessage,
      });
      throw errorMessage;
    }
  },
};

const unloadedState: State = {
  profile: undefined,
  isLoading: false,
};

export const reducer: Reducer<State> = (state: State | undefined, incomingAction: Action): State => {
  if (state === undefined) {
    return unloadedState;
  }

  const action = incomingAction as KnownAction;
  switch (action.type) {
    case 'REQUEST_USER_PROFILE':
      return createState(state, {
        isLoading: true,
        error: undefined,
      });
    case 'RECEIVE_USER_PROFILE':
      return createState(state, {
        isLoading: false,
        profile: action.profile,
      });
    case 'RECEIVE_USER_PROFILE_ERROR':
      return createState(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};
