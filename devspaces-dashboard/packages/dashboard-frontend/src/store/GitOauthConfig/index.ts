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

import { Action, Reducer } from 'redux';
import common, { api } from '@eclipse-che/common';
import { AppThunk } from '..';
import { createObject } from '../helpers';
import { AUTHORIZED } from '../sanityCheckMiddleware';
import { container } from '../../inversify.config';
import { CheWorkspaceClient } from '../../services/workspace-client/cheworkspace/cheWorkspaceClient';
import { IGitOauth } from './types';

export interface State {
  isLoading: boolean;
  gitOauth: IGitOauth[];
  error: string | undefined;
}

const cheWorkspaceClient = container.get(CheWorkspaceClient);

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
    async (dispatch): Promise<void> => {
      await dispatch({
        type: Type.REQUEST_GIT_OAUTH_CONFIG,
        check: AUTHORIZED,
      });
      const gitOauth: IGitOauth[] = [];
      try {
        const oAuthProviders = await cheWorkspaceClient.restApiClient.getOAuthProviders();
        const promises: Promise<void>[] = [];
        for (const { name, endpointUrl } of oAuthProviders) {
          promises.push(
            cheWorkspaceClient.restApiClient.getOAuthToken(name).then(() => {
              gitOauth.push({
                name: name as api.GitOauthProvider,
                endpointUrl,
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
    async (dispatch): Promise<void> => {
      await dispatch({
        type: Type.REQUEST_GIT_OAUTH_CONFIG,
        check: AUTHORIZED,
      });
      try {
        await cheWorkspaceClient.restApiClient.deleteOAuthToken(oauthProvider);
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
      return createObject(state, {
        isLoading: true,
        error: undefined,
      });
    case Type.RECEIVE_GIT_OAUTH_CONFIG:
      return createObject(state, {
        isLoading: false,
        gitOauth: action.gitOauth,
      });
    case Type.DELETE_OAUTH:
      return createObject(state, {
        isLoading: false,
        gitOauth: state.gitOauth.filter(v => v.name !== action.provider),
      });
    case Type.RECEIVE_GIT_OAUTH_CONFIG_ERROR:
      return createObject(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};
