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
import { createState } from '../helpers';
import { AppThunk } from '../index';
import { container } from '../../inversify.config';
import { CheWorkspaceClient } from '../../services/workspace-client/cheWorkspaceClient';
import { getErrorMessage } from '../../services/helpers/getErrorMessage';

const WorkspaceClient = container.get(CheWorkspaceClient);

export interface State {
  user: che.User | undefined;
  error?: string;
  isLoading: boolean;
}

interface RequestUserAction {
  type: 'REQUEST_USER';
}

interface ReceiveUserAction {
  type: 'RECEIVE_USER';
  user: che.User;
}

interface ReceiveErrorAction {
  type: 'RECEIVE_USER_ERROR';
  error: string;
}

interface SetUserAction {
  type: 'SET_USER';
  user: che.User;
}

type KnownAction = RequestUserAction
  | ReceiveUserAction
  | ReceiveErrorAction
  | SetUserAction;

export type ActionCreators = {
  requestUser: () => AppThunk<KnownAction, Promise<void>>;
  setUser: (user: che.User) => AppThunk<SetUserAction>;
};

export const actionCreators: ActionCreators = {
  requestUser: (): AppThunk<KnownAction, Promise<void>> => async (dispatch): Promise<void> => {
    dispatch({ type: 'REQUEST_USER' });

    try {
      const user = await WorkspaceClient.restApiClient.getCurrentUser() as che.User;
      dispatch({
        type: 'RECEIVE_USER',
        user,
      });
      return;
    } catch (e) {
      const errorMessage = 'Failed to fetch currently logged user info, reason: ' + getErrorMessage(e);
      dispatch({
        type: 'RECEIVE_USER_ERROR',
        error: errorMessage,
      });
      throw errorMessage;
    }
  },

  setUser: (user: che.User): AppThunk<SetUserAction> => dispatch => {
    dispatch({
      type: 'SET_USER',
      user: user,
    });
  },
};

const unloadedState: State = {
  user: undefined,
  isLoading: false,
};

export const reducer: Reducer<State> = (state: State | undefined, incomingAction: Action): State => {
  if (state === undefined) {
    return unloadedState;
  }

  const action = incomingAction as KnownAction;
  switch (action.type) {
    case 'REQUEST_USER':
      return createState(state, {
        isLoading: true,
        error: undefined,
      });
    case 'RECEIVE_USER':
      return createState(state, {
        isLoading: false,
        user: action.user,
      });
    case 'RECEIVE_USER_ERROR':
      return createState(state, {
        isLoading: false,
        error: action.error,
      });
    case 'SET_USER':
      return createState(state, {
        isLoading: false,
        user: action.user,
      });
    default:
      return state;
  }
};
