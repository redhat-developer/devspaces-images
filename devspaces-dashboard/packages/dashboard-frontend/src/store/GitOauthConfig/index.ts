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

import common, { api } from '@eclipse-che/common';
import { Action, Reducer } from 'redux';

import {
  deleteOAuthToken,
  getOAuthProviders,
  getOAuthToken,
} from '@/services/backend-client/oAuthApi';
import { IGitOauth } from '@/store/GitOauthConfig/types';
import { createObject } from '@/store/helpers';
import { selectAsyncIsAuthorized, selectSanityCheckError } from '@/store/SanityCheck/selectors';
import { AUTHORIZED } from '@/store/sanityCheckMiddleware';

import { AppThunk } from '..';

export interface State {
  isLoading: boolean;
  gitOauth: IGitOauth[];
  error: string | undefined;
}

export enum Type {
  REQUEST_GIT_OAUTH_CONFIG = 'REQUEST_GIT_OAUTH_CONFIG',
  DELETE_OAUTH = 'DELETE_OAUTH',
  RECEIVE_GIT_OAUTH_CONFIG = 'RECEIVE_GIT_OAUTH_CONFIG',
  RECEIVE_GIT_OAUTH_CONFIG_ERROR = 'RECEIVE_GIT_OAUTH_CONFIG_ERROR',
}

export interface RequestGitOauthConfigAction extends Action {
  type: Type.REQUEST_GIT_OAUTH_CONFIG;
}

export interface DeleteOauthAction extends Action {
  type: Type.DELETE_OAUTH;
  provider: api.GitOauthProvider;
}

export interface ReceiveGitOauthConfigAction extends Action {
  type: Type.RECEIVE_GIT_OAUTH_CONFIG;
  gitOauth: IGitOauth[];
}

export interface ReceivedGitOauthConfigErrorAction extends Action {
  type: Type.RECEIVE_GIT_OAUTH_CONFIG_ERROR;
  error: string;
}

export type KnownAction =
  | RequestGitOauthConfigAction
  | DeleteOauthAction
  | ReceiveGitOauthConfigAction
  | ReceivedGitOauthConfigErrorAction;

export type ActionCreators = {
  requestGitOauthConfig: () => AppThunk<KnownAction, Promise<void>>;
  revokeOauth: (oauthProvider: api.GitOauthProvider) => AppThunk<KnownAction, Promise<void>>;
};

export const actionCreators: ActionCreators = {
  requestGitOauthConfig:
    (): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      dispatch({
        type: Type.REQUEST_GIT_OAUTH_CONFIG,
        check: AUTHORIZED,
      });
      if (!(await selectAsyncIsAuthorized(getState()))) {
        const error = selectSanityCheckError(getState());
        dispatch({
          type: Type.RECEIVE_GIT_OAUTH_CONFIG_ERROR,
          error,
        });
        throw new Error(error);
      }

      const gitOauth: IGitOauth[] = [];
      try {
        const oAuthProviders = await getOAuthProviders();
        const promises: Promise<void>[] = [];
        for (const { name, endpointUrl, links } of oAuthProviders) {
          promises.push(
            getOAuthToken(name).then(() => {
              gitOauth.push({
                name: name as api.GitOauthProvider,
                endpointUrl,
                links,
              });
            }),
          );
        }
        await Promise.allSettled(promises);

        dispatch({
          type: Type.RECEIVE_GIT_OAUTH_CONFIG,
          gitOauth,
        });
      } catch (e) {
        const errorMessage = common.helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_GIT_OAUTH_CONFIG_ERROR,
          error: errorMessage,
        });
        throw e;
      }
    },

  revokeOauth:
    (oauthProvider: api.GitOauthProvider): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      dispatch({
        type: Type.REQUEST_GIT_OAUTH_CONFIG,
        check: AUTHORIZED,
      });
      if (!(await selectAsyncIsAuthorized(getState()))) {
        const error = selectSanityCheckError(getState());
        dispatch({
          type: Type.RECEIVE_GIT_OAUTH_CONFIG_ERROR,
          error,
        });
        throw new Error(error);
      }

      try {
        await deleteOAuthToken(oauthProvider);
        dispatch({
          type: Type.DELETE_OAUTH,
          provider: oauthProvider,
        });
      } catch (e) {
        const errorMessage = common.helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_GIT_OAUTH_CONFIG_ERROR,
          error: errorMessage,
        });
        throw e;
      }
    },
};

const unloadedState: State = {
  isLoading: false,
  gitOauth: [],
  error: undefined,
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
    case Type.REQUEST_GIT_OAUTH_CONFIG:
      return createObject<State>(state, {
        isLoading: true,
        error: undefined,
      });
    case Type.RECEIVE_GIT_OAUTH_CONFIG:
      return createObject<State>(state, {
        isLoading: false,
        gitOauth: action.gitOauth,
      });
    case Type.DELETE_OAUTH:
      return createObject<State>(state, {
        isLoading: false,
        gitOauth: state.gitOauth.filter(v => v.name !== action.provider),
      });
    case Type.RECEIVE_GIT_OAUTH_CONFIG_ERROR:
      return createObject<State>(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};
