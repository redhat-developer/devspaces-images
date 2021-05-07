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

// This state defines the type of data maintained in the Redux store.

import { Action, Reducer } from 'redux';
import { createState } from './helpers';
import { AppThunk } from './index';
import { container } from '../inversify.config';
import { CheWorkspaceClient } from '../services/workspace-client/cheWorkspaceClient';

const WorkspaceClient = container.get(CheWorkspaceClient);

export interface State {
  profile: api.che.user.Profile | undefined;
  isLoading: boolean;
}

interface RequestUserProfileAction {
  type: 'REQUEST_USER_PROFILE';
}

interface ReceiveUserProfileAction {
  type: 'RECEIVE_USER_PROFILE';
  profile: api.che.user.Profile | undefined;
}

type KnownAction = RequestUserProfileAction
  | ReceiveUserProfileAction;

export type ActionCreators = {
  requestUserProfile: () => AppThunk<KnownAction, Promise<void>>;
};

export const actionCreators: ActionCreators = {
  requestUserProfile: (): AppThunk<KnownAction, Promise<void>> => async (dispatch): Promise<void> => {
    dispatch({ type: 'REQUEST_USER_PROFILE' });

    try {
      const data = await WorkspaceClient.restApiClient.getCurrentUserProfile();
      dispatch({ type: 'RECEIVE_USER_PROFILE', profile: <api.che.user.Profile>data });
    } catch (e) {
      throw new Error(e.message ? e.message : 'Failed to request userProfile');
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
      });
    case 'RECEIVE_USER_PROFILE':
      return createState(state, {
        isLoading: false,
        profile: action.profile,
      });
    default:
      return state;
  }
};
