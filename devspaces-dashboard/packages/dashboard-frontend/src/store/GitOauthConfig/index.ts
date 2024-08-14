/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
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

import { provisionKubernetesNamespace } from '@/services/backend-client/kubernetesNamespaceApi';
import {
  deleteOAuthToken,
  getOAuthProviders,
  getOAuthToken,
} from '@/services/backend-client/oAuthApi';
import { fetchTokens } from '@/services/backend-client/personalAccessTokenApi';
import {
  deleteSkipOauthProvider,
  getWorkspacePreferences,
} from '@/services/backend-client/workspacePreferencesApi';
import { IGitOauth } from '@/store/GitOauthConfig/types';
import { createObject } from '@/store/helpers';
import { selectDefaultNamespace } from '@/store/InfrastructureNamespaces/selectors';
import { selectAsyncIsAuthorized, selectSanityCheckError } from '@/store/SanityCheck/selectors';
import { AUTHORIZED } from '@/store/sanityCheckMiddleware';

import { AppThunk } from '..';

export interface State {
  isLoading: boolean;
  gitOauth: IGitOauth[];
  providersWithToken: api.GitOauthProvider[]; // authentication succeeded
  skipOauthProviders: api.GitOauthProvider[]; // authentication declined
  error: string | undefined;
}

export enum Type {
  REQUEST_GIT_OAUTH = 'REQUEST_GIT_OAUTH',
  DELETE_GIT_OAUTH_TOKEN = 'DELETE_GIT_OAUTH_TOKEN',
  RECEIVE_GIT_OAUTH_PROVIDERS = 'RECEIVE_GIT_OAUTH_PROVIDERS',
  RECEIVE_SKIP_OAUTH_PROVIDERS = 'RECEIVE_SKIP_OAUTH_PROVIDERS',
  DELETE_SKIP_OAUTH = 'DELETE_SKIP_OAUTH',
  RECEIVE_GIT_OAUTH_ERROR = 'RECEIVE_GIT_OAUTH_ERROR',
}

export interface RequestGitOAuthAction extends Action {
  type: Type.REQUEST_GIT_OAUTH;
}

export interface DeleteOauthAction extends Action {
  type: Type.DELETE_GIT_OAUTH_TOKEN;
  provider: api.GitOauthProvider;
}

export interface ReceiveGitOAuthConfigAction extends Action {
  type: Type.RECEIVE_GIT_OAUTH_PROVIDERS;
  supportedGitOauth: IGitOauth[];
  providersWithToken: api.GitOauthProvider[];
}

export interface ReceivedGitOauthErrorAction extends Action {
  type: Type.RECEIVE_GIT_OAUTH_ERROR;
  error: string;
}

export interface ReceiveSkipOauthProvidersAction extends Action {
  type: Type.RECEIVE_SKIP_OAUTH_PROVIDERS;
  skipOauthProviders: api.GitOauthProvider[];
}

export type KnownAction =
  | RequestGitOAuthAction
  | ReceiveGitOAuthConfigAction
  | ReceiveSkipOauthProvidersAction
  | DeleteOauthAction
  | ReceivedGitOauthErrorAction;

export type ActionCreators = {
  requestSkipAuthorizationProviders: () => AppThunk<KnownAction, Promise<void>>;
  requestGitOauthConfig: () => AppThunk<KnownAction, Promise<void>>;
  revokeOauth: (oauthProvider: api.GitOauthProvider) => AppThunk<KnownAction, Promise<void>>;
  deleteSkipOauth: (oauthProvider: api.GitOauthProvider) => AppThunk<KnownAction, Promise<void>>;
};

export const actionCreators: ActionCreators = {
  requestSkipAuthorizationProviders:
    (): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      dispatch({
        type: Type.REQUEST_GIT_OAUTH,
        check: AUTHORIZED,
      });
      if (!(await selectAsyncIsAuthorized(getState()))) {
        const error = selectSanityCheckError(getState());
        dispatch({
          type: Type.RECEIVE_GIT_OAUTH_ERROR,
          error,
        });
        throw new Error(error);
      }

      const defaultKubernetesNamespace = selectDefaultNamespace(getState());
      try {
        const devWorkspacePreferences = await getWorkspacePreferences(
          defaultKubernetesNamespace.name,
        );

        const skipOauthProviders = devWorkspacePreferences['skip-authorisation'] || [];
        dispatch({
          type: Type.RECEIVE_SKIP_OAUTH_PROVIDERS,
          skipOauthProviders,
        });
      } catch (e) {
        const errorMessage = common.helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_GIT_OAUTH_ERROR,
          error: errorMessage,
        });
        throw e;
      }
    },

  requestGitOauthConfig:
    (): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      dispatch({
        type: Type.REQUEST_GIT_OAUTH,
        check: AUTHORIZED,
      });
      if (!(await selectAsyncIsAuthorized(getState()))) {
        const error = selectSanityCheckError(getState());
        dispatch({
          type: Type.RECEIVE_GIT_OAUTH_ERROR,
          error,
        });
        throw new Error(error);
      }

      const providersWithToken: api.GitOauthProvider[] = [];
      try {
        const supportedGitOauth = await getOAuthProviders();

        const defaultKubernetesNamespace = selectDefaultNamespace(getState());
        const tokens = await fetchTokens(defaultKubernetesNamespace.name);

        const promises: Promise<void>[] = [];
        for (const gitOauth of supportedGitOauth) {
          promises.push(
            getOAuthToken(gitOauth.name)
              .then(() => {
                providersWithToken.push(gitOauth.name);
              })

              // if `api/oauth/token` doesn't return a user's token,
              // then check if there is the user's token in a Kubernetes Secret
              .catch(() => {
                const normalizedGitOauthEndpoint = gitOauth.endpointUrl.endsWith('/')
                  ? gitOauth.endpointUrl.slice(0, -1)
                  : gitOauth.endpointUrl;

                for (const token of tokens) {
                  const normalizedTokenGitProviderEndpoint = token.gitProviderEndpoint.endsWith('/')
                    ? token.gitProviderEndpoint.slice(0, -1)
                    : token.gitProviderEndpoint;

                  // compare Git OAuth Endpoint url ONLY with OAuth tokens
                  const gitProvider = token.gitProvider;
                  if (
                    (gitProvider.startsWith('oauth2') ||
                      // The git provider value format of a bitbucket-server token is 'che-token-<user id>-<che hostname>'
                      new RegExp(`^che-token-<.*>-<${window.location.hostname}>$`).test(
                        gitProvider,
                      )) &&
                    normalizedGitOauthEndpoint === normalizedTokenGitProviderEndpoint
                  ) {
                    providersWithToken.push(gitOauth.name);
                    break;
                  }
                }
              }),
          );
        }
        promises.push(dispatch(actionCreators.requestSkipAuthorizationProviders()));
        await Promise.allSettled(promises);

        dispatch({
          type: Type.RECEIVE_GIT_OAUTH_PROVIDERS,
          supportedGitOauth,
          providersWithToken,
        });
      } catch (e) {
        const errorMessage = common.helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_GIT_OAUTH_ERROR,
          error: errorMessage,
        });
        throw e;
      }
    },

  revokeOauth:
    (oauthProvider: api.GitOauthProvider): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      dispatch({
        type: Type.REQUEST_GIT_OAUTH,
        check: AUTHORIZED,
      });
      if (!(await selectAsyncIsAuthorized(getState()))) {
        const error = selectSanityCheckError(getState());
        dispatch({
          type: Type.RECEIVE_GIT_OAUTH_ERROR,
          error,
        });
        throw new Error(error);
      }

      try {
        await deleteOAuthToken(oauthProvider);

        // request namespace provision as it triggers tokens validation
        try {
          await provisionKubernetesNamespace();
          /* c8 ignore next 3 */
        } catch (e) {
          // no-op
        }

        dispatch({
          type: Type.DELETE_GIT_OAUTH_TOKEN,
          provider: oauthProvider,
        });
      } catch (e) {
        const errorMessage = common.helpers.errors.getMessage(e);
        if (new RegExp('^OAuth token for user .* was not found$').test(errorMessage)) {
          dispatch({
            type: Type.DELETE_GIT_OAUTH_TOKEN,
            provider: oauthProvider,
          });
        } else {
          dispatch({
            type: Type.RECEIVE_GIT_OAUTH_ERROR,
            error: errorMessage,
          });
          throw e;
        }
      }
    },

  deleteSkipOauth:
    (oauthProvider: api.GitOauthProvider): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      dispatch({
        type: Type.REQUEST_GIT_OAUTH,
        check: AUTHORIZED,
      });
      if (!(await selectAsyncIsAuthorized(getState()))) {
        const error = selectSanityCheckError(getState());
        dispatch({
          type: Type.RECEIVE_GIT_OAUTH_ERROR,
          error,
        });
        throw new Error(error);
      }

      const defaultKubernetesNamespace = selectDefaultNamespace(getState());
      try {
        await deleteSkipOauthProvider(defaultKubernetesNamespace.name, oauthProvider);
        await dispatch(actionCreators.requestSkipAuthorizationProviders());
      } catch (e) {
        const errorMessage = common.helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_GIT_OAUTH_ERROR,
          error: errorMessage,
        });
        throw e;
      }
    },
};

const unloadedState: State = {
  isLoading: false,
  gitOauth: [],
  providersWithToken: [],
  skipOauthProviders: [],
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
    case Type.REQUEST_GIT_OAUTH:
      return createObject<State>(state, {
        isLoading: true,
        error: undefined,
      });
    case Type.RECEIVE_GIT_OAUTH_PROVIDERS:
      return createObject<State>(state, {
        isLoading: false,
        gitOauth: action.supportedGitOauth,
        providersWithToken: action.providersWithToken,
      });
    case Type.RECEIVE_SKIP_OAUTH_PROVIDERS:
      return createObject<State>(state, {
        isLoading: false,
        skipOauthProviders: action.skipOauthProviders,
      });
    case Type.DELETE_GIT_OAUTH_TOKEN:
      return createObject<State>(state, {
        isLoading: false,
        providersWithToken: state.providersWithToken.filter(
          provider => provider !== action.provider,
        ),
      });
    case Type.RECEIVE_GIT_OAUTH_ERROR:
      return createObject<State>(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};
