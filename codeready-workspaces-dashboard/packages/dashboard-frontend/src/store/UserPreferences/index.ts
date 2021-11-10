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
import common from '@eclipse-che/common';
import { createObject } from '../helpers';
import { AppThunk } from '..';
import { container } from '../../inversify.config';
import { CheWorkspaceClient } from '../../services/workspace-client/cheworkspace/cheWorkspaceClient';

const WorkspaceClient = container.get(CheWorkspaceClient);

export interface State {
  preferences: che.UserPreferences;
  isLoading: boolean;
}

interface RequestUserPreferencesAction {
  type: 'REQUEST_USER_PREFERENCES';
}

interface ReceiveUserPreferencesAction {
  type: 'RECEIVE_USER_PREFERENCES';
  preferences: che.UserPreferences;
}

type KnownAction = RequestUserPreferencesAction | ReceiveUserPreferencesAction;

export type ActionCreators = {
  requestUserPreferences: (filter: string | undefined) => AppThunk<KnownAction, Promise<void>>;
  replaceUserPreferences: (
    preferences: che.UserPreferences,
  ) => AppThunk<KnownAction, Promise<void>>;
};

export const actionCreators: ActionCreators = {
  requestUserPreferences:
    (filter: string | undefined): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      dispatch({ type: 'REQUEST_USER_PREFERENCES' });

      try {
        const data = await WorkspaceClient.restApiClient.getUserPreferences(filter);
        dispatch({ type: 'RECEIVE_USER_PREFERENCES', preferences: data });
        return;
      } catch (e) {
        const errorMessage =
          'Failed to request user preferences, reason: ' + common.helpers.errors.getMessage(e);
        throw new Error(errorMessage);
      }
    },
  replaceUserPreferences:
    (preferences: che.UserPreferences): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      dispatch({ type: 'REQUEST_USER_PREFERENCES' });

      try {
        await WorkspaceClient.restApiClient.replaceUserPreferences(preferences);
        dispatch({ type: 'RECEIVE_USER_PREFERENCES', preferences });
        return;
      } catch (e) {
        const errorMessage =
          'Failed to update user preferences, reason: ' + common.helpers.errors.getMessage(e);
        throw new Error(errorMessage);
      }
    },
};

const unloadedState: State = {
  preferences: {},
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
    case 'REQUEST_USER_PREFERENCES':
      return createObject(state, {
        isLoading: true,
      });
    case 'RECEIVE_USER_PREFERENCES':
      return createObject(state, {
        isLoading: false,
        preferences: action.preferences,
      });
    default:
      return state;
  }
};
