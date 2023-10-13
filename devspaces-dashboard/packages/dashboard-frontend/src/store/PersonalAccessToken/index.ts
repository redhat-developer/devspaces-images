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

import { provisionKubernetesNamespace } from '@/services/backend-client/kubernetesNamespaceApi';
import {
  addToken,
  fetchTokens,
  removeToken,
  updateToken,
} from '@/services/backend-client/personalAccessTokenApi';
import { createObject } from '@/store/helpers';
import { selectDefaultNamespace } from '@/store/InfrastructureNamespaces/selectors';
import { State } from '@/store/PersonalAccessToken/state';
import { selectAsyncIsAuthorized, selectSanityCheckError } from '@/store/SanityCheck/selectors';
import { AUTHORIZED, SanityCheckAction } from '@/store/sanityCheckMiddleware';

import { AppThunk } from '..';

export * from './state';

export enum Type {
  RECEIVE_ERROR = 'RECEIVE_ERROR',
  RECEIVE_TOKENS = 'RECEIVE_TOKENS',
  REQUEST_TOKENS = 'REQUEST_TOKENS',
  ADD_TOKEN = 'ADD_TOKEN',
  UPDATE_TOKEN = 'UPDATE_TOKEN',
  REMOVE_TOKEN = 'REMOVE_TOKEN',
}

export interface RequestTokensAction extends Action, SanityCheckAction {
  type: Type.REQUEST_TOKENS;
}

export interface ReceiveTokensAction extends Action {
  type: Type.RECEIVE_TOKENS;
  tokens: api.PersonalAccessToken[];
}

export interface AddTokenAction extends Action {
  type: Type.ADD_TOKEN;
  token: api.PersonalAccessToken;
}

export interface UpdateTokenAction extends Action {
  type: Type.UPDATE_TOKEN;
  token: api.PersonalAccessToken;
}

export interface RemoveTokenAction extends Action {
  type: Type.REMOVE_TOKEN;
  token: api.PersonalAccessToken;
}

export interface ReceiveErrorAction extends Action {
  type: Type.RECEIVE_ERROR;
  error: string;
}

export type KnownAction =
  | AddTokenAction
  | ReceiveErrorAction
  | ReceiveTokensAction
  | RequestTokensAction
  | UpdateTokenAction
  | RemoveTokenAction;

export type ActionCreators = {
  requestTokens: () => AppThunk<KnownAction, Promise<void>>;
  addToken: (token: api.PersonalAccessToken) => AppThunk<KnownAction, Promise<void>>;
  updateToken: (token: api.PersonalAccessToken) => AppThunk<KnownAction, Promise<void>>;
  removeToken: (token: api.PersonalAccessToken) => AppThunk<KnownAction, Promise<void>>;
};

export const actionCreators: ActionCreators = {
  requestTokens:
    (): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      dispatch({
        type: Type.REQUEST_TOKENS,
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
        const tokens = await fetchTokens(namespace);
        dispatch({
          type: Type.RECEIVE_TOKENS,
          tokens,
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

  addToken:
    (token: api.PersonalAccessToken): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      dispatch({
        type: Type.REQUEST_TOKENS,
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
      let newToken: api.PersonalAccessToken;
      try {
        newToken = await addToken(namespace, token);
      } catch (e) {
        const errorMessage = helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_ERROR,
          error: errorMessage,
        });
        throw e;
      }

      /* request namespace provision as it triggers tokens validation */
      await provisionKubernetesNamespace();

      /* check if the new token is available */

      const allTokens = await fetchTokens(namespace);
      const tokenExists = allTokens.some(t => t.tokenName === newToken.tokenName);

      if (tokenExists) {
        dispatch({
          type: Type.ADD_TOKEN,
          token: newToken,
        });
      } else {
        const errorMessage = `Token "${newToken.tokenName}" was not added because it is not valid.`;
        dispatch({
          type: Type.RECEIVE_ERROR,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }
    },

  updateToken:
    (token: api.PersonalAccessToken): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      dispatch({
        type: Type.REQUEST_TOKENS,
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
        const newToken = await updateToken(namespace, token);
        dispatch({
          type: Type.UPDATE_TOKEN,
          token: newToken,
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

  removeToken:
    (token: api.PersonalAccessToken): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      dispatch({
        type: Type.REQUEST_TOKENS,
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
        await removeToken(namespace, token);
        dispatch({
          type: Type.REMOVE_TOKEN,
          token,
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
  tokens: [],
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
    case Type.REQUEST_TOKENS:
      return createObject<State>(state, {
        isLoading: true,
        error: undefined,
      });
    case Type.RECEIVE_TOKENS:
      return createObject<State>(state, {
        isLoading: false,
        tokens: action.tokens,
      });
    case Type.ADD_TOKEN:
      return createObject<State>(state, {
        isLoading: false,
        tokens: [...state.tokens, action.token],
      });
    case Type.UPDATE_TOKEN:
      return createObject<State>(state, {
        isLoading: false,
        tokens: state.tokens.map(token =>
          token.tokenName === action.token.tokenName ? action.token : token,
        ),
      });
    case Type.REMOVE_TOKEN:
      return createObject<State>(state, {
        isLoading: false,
        tokens: state.tokens.filter(token => token.tokenName !== action.token.tokenName),
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
