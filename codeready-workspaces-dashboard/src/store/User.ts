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
  user: che.User | undefined;
  isLoading: boolean;
}

interface RequestUserAction {
  type: 'REQUEST_USER';
}

interface ReceiveUserAction {
  type: 'RECEIVE_USER';
  user: che.User;
}

interface SetUserAction {
  type: 'SET_USER';
  user: che.User;
}

type KnownAction = RequestUserAction
  | ReceiveUserAction | SetUserAction;

export type ActionCreators = {
  requestUser: () => AppThunk<KnownAction, Promise<void>>;
  setUser: (user: che.User) => AppThunk<SetUserAction>;
};

export const actionCreators: ActionCreators = {
  requestUser: (): AppThunk<KnownAction, Promise<void>> => async (dispatch): Promise<void> => {
    dispatch({ type: 'REQUEST_USER' });

    try {
      const data = await WorkspaceClient.restApiClient.getCurrentUser();
      dispatch({ type: 'RECEIVE_USER', user: <che.User>data });
      return;
    } catch (e) {
      throw new Error(e.message ? e.message : 'Failed to request user');
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
      });
    case 'RECEIVE_USER':
      return createState(state, {
        isLoading: false,
        user: action.user,
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
