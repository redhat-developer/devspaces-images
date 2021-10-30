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
import { helpers } from '@eclipse-che/common';
import { AppThunk } from '../..';
import { createObject } from '../../helpers';
import { ContainerCredentials, RegistryEntry } from '../types';
import { State } from '../dockerConfigState';
import * as UserPreferences from '../../UserPreferences';
export * from '../dockerConfigState';

export interface RequestCredentialsAction extends Action {
  type: 'REQUEST_CHEWORKSPACE_CREDENTIALS';
}

export interface SetCredentialsAction extends Action {
  type: 'SET_CHEWORKSPACE_CREDENTIALS';
  registries: RegistryEntry[];
}

export interface ReceiveErrorAction extends Action {
  type: 'RECEIVE_CHEWORKSPACE_CREDENTIALS_ERROR';
  error: string;
}

export type KnownAction = RequestCredentialsAction | SetCredentialsAction | ReceiveErrorAction;

export type ActionCreators = {
  requestCredentials: () => AppThunk<KnownAction, Promise<void>>;
  updateCredentials: (registries: RegistryEntry[]) => AppThunk<KnownAction, Promise<void>>;
};

export const actionCreators: ActionCreators = {

  requestCredentials: (): AppThunk<KnownAction, Promise<void>> => async (dispatch, getState): Promise<void> => {
    dispatch({ type: 'REQUEST_CHEWORKSPACE_CREDENTIALS' });
    const { userPreferences: { preferences } } = getState();
    try {
      await dispatch(UserPreferences.actionCreators.requestUserPreferences(undefined));
      const registries: RegistryEntry[] = [];
      if (preferences.dockerCredentials) {
        const containerCredentials: ContainerCredentials = JSON.parse(window.atob(preferences.dockerCredentials));
        for (const [url, value] of Object.entries(containerCredentials)) {
          const { username, password } = value || {};
          registries.push({ url, username, password });
        }
      }
      dispatch({
        type: 'SET_CHEWORKSPACE_CREDENTIALS',
        registries,
      });
    } catch (e) {
      const errorMessage = 'Failed to request the docker config. Reason: ' + helpers.errors.getMessage(e);
      dispatch({
        type: 'RECEIVE_CHEWORKSPACE_CREDENTIALS_ERROR',
        error: errorMessage
      });
      throw errorMessage;
    }
  },

  updateCredentials: (registries: RegistryEntry[]): AppThunk<KnownAction, Promise<void>> => async (dispatch, getState): Promise<void> => {
    dispatch({ type: 'REQUEST_CHEWORKSPACE_CREDENTIALS' });
    const { userPreferences: { preferences } } = getState();
    const newContainerCredentials: ContainerCredentials = {};
    registries.forEach(item => {
      const { url, username, password } = item;
      newContainerCredentials[url] = { username, password };
    });
    const dockerCredentials = window.btoa(JSON.stringify(newContainerCredentials));
    const prefUpdate = Object.assign({}, preferences, { dockerCredentials }) as che.UserPreferences;
    try {
      await dispatch(UserPreferences.actionCreators.replaceUserPreferences(prefUpdate));
      dispatch({
        type: 'SET_CHEWORKSPACE_CREDENTIALS',
        registries
      });
    } catch (e) {
      const errorMessage = 'Failed to update the docker cofig. Reason: ' + helpers.errors.getMessage(e);
      dispatch({
        type: 'RECEIVE_CHEWORKSPACE_CREDENTIALS_ERROR',
        error: errorMessage
      });
      throw errorMessage;
    }
  }
};

const unloadedState: State = {
  isLoading: false,
  registries: [],
  error: undefined,
};

export const reducer: Reducer<State> = (state: State | undefined, action: KnownAction): State => {
  if (state === undefined) {
    return unloadedState;
  }

  switch (action.type) {
    case 'REQUEST_CHEWORKSPACE_CREDENTIALS':
      return createObject(state, {
        isLoading: true,
        error: undefined,
      });
    case 'SET_CHEWORKSPACE_CREDENTIALS':
      return createObject(state, {
        isLoading: false,
        registries: action.registries,
      });
    case 'RECEIVE_CHEWORKSPACE_CREDENTIALS_ERROR':
      return createObject(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};
