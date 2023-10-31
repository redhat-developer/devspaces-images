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

import { api, helpers } from '@eclipse-che/common';
import { Action, Reducer } from 'redux';

import { addSshKey, fetchSshKeys, removeSshKey } from '@/services/backend-client/sshKeysApi';
import { createObject } from '@/store/helpers';
import { selectDefaultNamespace } from '@/store/InfrastructureNamespaces/selectors';
import { selectAsyncIsAuthorized, selectSanityCheckError } from '@/store/SanityCheck/selectors';
import { AUTHORIZED, SanityCheckAction } from '@/store/sanityCheckMiddleware';
import { State } from '@/store/SshKeys/state';

import { AppThunk } from '..';

export * from './state';

export enum Type {
  RECEIVE_ERROR = 'RECEIVE_ERROR',
  RECEIVE_KEYS = 'RECEIVE_KEYS',
  REQUEST_KEYS = 'REQUEST_KEYS',
  ADD_KEY = 'ADD_KEY',
  REMOVE_KEY = 'REMOVE_KEY',
}

export interface RequestKeysAction extends Action, SanityCheckAction {
  type: Type.REQUEST_KEYS;
}

export interface ReceiveKeysAction extends Action {
  type: Type.RECEIVE_KEYS;
  keys: api.SshKey[];
}

export interface AddKeyAction extends Action {
  type: Type.ADD_KEY;
  key: api.SshKey;
}

export interface RemoveKeyAction extends Action {
  type: Type.REMOVE_KEY;
  key: api.SshKey;
}

export interface ReceiveErrorAction extends Action {
  type: Type.RECEIVE_ERROR;
  error: string;
}

export type KnownAction =
  | AddKeyAction
  | ReceiveErrorAction
  | ReceiveKeysAction
  | RequestKeysAction
  | RemoveKeyAction;

export type ActionCreators = {
  requestSshKeys: () => AppThunk<KnownAction, Promise<void>>;
  addSshKey: (key: api.NewSshKey) => AppThunk<KnownAction, Promise<void>>;
  removeSshKey: (key: api.SshKey) => AppThunk<KnownAction, Promise<void>>;
};

export const actionCreators: ActionCreators = {
  requestSshKeys:
    (): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      dispatch({
        type: Type.REQUEST_KEYS,
        check: AUTHORIZED,
      });
      if (!(await selectAsyncIsAuthorized(getState()))) {
        const error = selectSanityCheckError(getState());
        dispatch({
          type: Type.RECEIVE_ERROR,
          error,
        });
        throw new Error(error);
      }

      const state = getState();
      const namespace = selectDefaultNamespace(state).name;
      try {
        const keys = await fetchSshKeys(namespace);
        dispatch({
          type: Type.RECEIVE_KEYS,
          keys,
        });
      } catch (e) {
        const errorMessage = helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_ERROR,
          error: errorMessage,
        });
        throw e;
      }
    },

  addSshKey:
    (key: api.NewSshKey): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      dispatch({
        type: Type.REQUEST_KEYS,
        check: AUTHORIZED,
      });
      if (!(await selectAsyncIsAuthorized(getState()))) {
        const error = selectSanityCheckError(getState());
        dispatch({
          type: Type.RECEIVE_ERROR,
          error,
        });
        throw new Error(error);
      }

      const state = getState();
      const namespace = selectDefaultNamespace(state).name;
      try {
        const newSshKey = await addSshKey(namespace, key);
        dispatch({
          type: Type.ADD_KEY,
          key: newSshKey,
        });
      } catch (e) {
        const errorMessage = helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_ERROR,
          error: errorMessage,
        });
        throw e;
      }
    },

  removeSshKey:
    (key: api.SshKey): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      dispatch({
        type: Type.REQUEST_KEYS,
        check: AUTHORIZED,
      });
      if (!(await selectAsyncIsAuthorized(getState()))) {
        const error = selectSanityCheckError(getState());
        dispatch({
          type: Type.RECEIVE_ERROR,
          error,
        });
        throw new Error(error);
      }

      const state = getState();
      const namespace = selectDefaultNamespace(state).name;
      try {
        await removeSshKey(namespace, key);
        dispatch({
          type: Type.REMOVE_KEY,
          key,
        });
      } catch (e) {
        const errorMessage = helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_ERROR,
          error: errorMessage,
        });
        throw e;
      }
    },
};

const unloadedState: State = {
  isLoading: false,
  keys: [],
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
    case Type.REQUEST_KEYS:
      return createObject<State>(state, {
        isLoading: true,
        error: undefined,
      });
    case Type.RECEIVE_KEYS:
      return createObject<State>(state, {
        isLoading: false,
        keys: action.keys,
      });
    case Type.ADD_KEY:
      return createObject<State>(state, {
        isLoading: false,
        keys: [...state.keys, action.key],
      });
    case Type.REMOVE_KEY:
      return createObject<State>(state, {
        isLoading: false,
        keys: state.keys.filter(key => key.name !== action.key.name),
      });
    case Type.RECEIVE_ERROR:
      return createObject<State>(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};
