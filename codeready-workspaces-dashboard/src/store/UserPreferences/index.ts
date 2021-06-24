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

import { createState } from '../helpers';
import { Action, Reducer } from 'redux';
import { AppThunk } from '../';
import { container } from '../../inversify.config';
import { CheWorkspaceClient } from '../../services/workspace-client/cheWorkspaceClient';
import { ContainerCredentials, RegistryRow } from './types';

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
  preferences: che.UserPreferences
}

type KnownAction = RequestUserPreferencesAction
  | ReceiveUserPreferencesAction;

export type ActionCreators = {
  requestUserPreferences: (filter: string | undefined) => AppThunk<KnownAction, Promise<void>>;
  replaceUserPreferences: (preferences: che.UserPreferences) => AppThunk<KnownAction, Promise<void>>;
  updateContainerRegistries: (registries: RegistryRow[]) => AppThunk<KnownAction, Promise<void>>;
};

export const actionCreators: ActionCreators = {
  requestUserPreferences: (filter: string | undefined): AppThunk<KnownAction, Promise<void>> => async (dispatch): Promise<void> => {
    dispatch({ type: 'REQUEST_USER_PREFERENCES' });

    try {
      const data = await WorkspaceClient.restApiClient.getUserPreferences(filter);
      dispatch({ type: 'RECEIVE_USER_PREFERENCES', preferences: data });
      return;
    } catch (e) {
      throw new Error(e.message ? e.message : 'Failed to request user preferences');
    }
  },
  replaceUserPreferences: (preferences: che.UserPreferences): AppThunk<KnownAction, Promise<void>> => async (dispatch): Promise<void> => {
    dispatch({ type: 'REQUEST_USER_PREFERENCES' });

    try {
      await WorkspaceClient.restApiClient.replaceUserPreferences(preferences);
      dispatch({ type: 'RECEIVE_USER_PREFERENCES', preferences });
      return;
    } catch (e) {
      throw new Error(e.message ? e.message : 'Failed to replace user preferences');
    }
  },
  updateContainerRegistries: (registries: RegistryRow[]): AppThunk<KnownAction, Promise<void>> => async (dispatch): Promise<void> => {
    const newContainerCredentials: ContainerCredentials = {};
    registries.forEach(item => {
      const { url, username, password } = item;
      newContainerCredentials[url] = { username, password };
    });
    try {
      const prefUpdate = { dockerCredentials: btoa(JSON.stringify(newContainerCredentials)) };
      dispatch({ type: 'REQUEST_USER_PREFERENCES' });
      const preferences = await WorkspaceClient.restApiClient.updateUserPreferences(prefUpdate);
      dispatch({ type: 'RECEIVE_USER_PREFERENCES', preferences });
      return;
    } catch (e) {
      throw new Error(e.message ? e.message : 'Failed to update docker registries');
    }
  },
};

const unloadedState: State = {
  preferences: {},
  isLoading: false,
};

export const reducer: Reducer<State> = (state: State | undefined, incomingAction: Action): State => {
  if (state === undefined) {
    return unloadedState;
  }

  const action = incomingAction as KnownAction;
  switch (action.type) {
    case 'REQUEST_USER_PREFERENCES':
      return createState(state, {
        isLoading: true,
      });
    case 'RECEIVE_USER_PREFERENCES':
      return createState(state, {
        isLoading: false,
        preferences: action.preferences
      });
    default:
      return state;
  }
};
