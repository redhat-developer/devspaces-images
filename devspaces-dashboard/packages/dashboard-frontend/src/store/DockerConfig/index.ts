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

import * as DwApi from '@/services/backend-client/devWorkspaceApi';
import { RegistryEntry } from '@/store/DockerConfig/types';
import { createObject } from '@/store/helpers';
import { selectDefaultNamespace } from '@/store/InfrastructureNamespaces/selectors';
import { selectAsyncIsAuthorized, selectSanityCheckError } from '@/store/SanityCheck/selectors';
import { AUTHORIZED, SanityCheckAction } from '@/store/sanityCheckMiddleware';

import { AppThunk } from '..';

export interface State {
  isLoading: boolean;
  registries: RegistryEntry[];
  resourceVersion?: string;
  error: string | undefined;
}

export enum Type {
  REQUEST_DEVWORKSPACE_CREDENTIALS = 'REQUEST_DEVWORKSPACE_CREDENTIALS',
  SET_DEVWORKSPACE_CREDENTIALS = 'SET_DEVWORKSPACE_CREDENTIALS',
  RECEIVE_DEVWORKSPACE_CREDENTIALS_ERROR = 'RECEIVE_DEVWORKSPACE_CREDENTIALS_ERROR',
}

export interface RequestCredentialsAction extends Action, SanityCheckAction {
  type: Type.REQUEST_DEVWORKSPACE_CREDENTIALS;
}

export interface SetCredentialsAction extends Action {
  type: Type.SET_DEVWORKSPACE_CREDENTIALS;
  registries: RegistryEntry[];
  resourceVersion: string | undefined;
}

export interface ReceiveErrorAction extends Action {
  type: Type.RECEIVE_DEVWORKSPACE_CREDENTIALS_ERROR;
  error: string;
}

export type KnownAction = RequestCredentialsAction | SetCredentialsAction | ReceiveErrorAction;

export type ActionCreators = {
  requestCredentials: () => AppThunk<KnownAction, Promise<void>>;
  updateCredentials: (registries: RegistryEntry[]) => AppThunk<KnownAction, Promise<void>>;
};

export const actionCreators: ActionCreators = {
  requestCredentials:
    (): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      const namespace = selectDefaultNamespace(getState()).name;
      try {
        await dispatch({ type: Type.REQUEST_DEVWORKSPACE_CREDENTIALS, check: AUTHORIZED });
        if (!(await selectAsyncIsAuthorized(getState()))) {
          const error = selectSanityCheckError(getState());
          throw new Error(error);
        }
        const { registries, resourceVersion } = await getDockerConfig(namespace);
        dispatch({
          type: Type.SET_DEVWORKSPACE_CREDENTIALS,
          registries,
          resourceVersion,
        });
      } catch (e) {
        const errorMessage = helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_DEVWORKSPACE_CREDENTIALS_ERROR,
          error: errorMessage,
        });
        throw e;
      }
    },

  updateCredentials:
    (registries: RegistryEntry[]): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      const state = getState();
      const namespace = selectDefaultNamespace(state).name;
      try {
        await dispatch({ type: Type.REQUEST_DEVWORKSPACE_CREDENTIALS, check: AUTHORIZED });
        if (!(await selectAsyncIsAuthorized(getState()))) {
          const error = selectSanityCheckError(getState());
          throw new Error(error);
        }
        const { resourceVersion } = await putDockerConfig(
          namespace,
          registries,
          state.dockerConfig?.resourceVersion,
        );
        dispatch({
          type: Type.SET_DEVWORKSPACE_CREDENTIALS,
          registries,
          resourceVersion,
        });
      } catch (e) {
        const errorMessage = helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_DEVWORKSPACE_CREDENTIALS_ERROR,
          error: errorMessage,
        });
        throw e;
      }
    },
};

async function getDockerConfig(
  namespace: string,
): Promise<{ registries: RegistryEntry[]; resourceVersion?: string }> {
  let dockerconfig, resourceVersion: string | undefined;
  try {
    const resp = await DwApi.getDockerConfig(namespace);
    dockerconfig = resp.dockerconfig;
    resourceVersion = resp.resourceVersion;
  } catch (e) {
    throw 'Failed to request the docker config. Reason: ' + helpers.errors.getMessage(e);
  }
  const registries: RegistryEntry[] = [];
  if (dockerconfig) {
    try {
      const auths = JSON.parse(window.atob(dockerconfig))['auths'];
      Object.keys(auths).forEach(key => {
        const [username, password] = window.atob(auths[key]['auth']).split(':');
        registries.push({ url: key, username, password });
      });
    } catch (e) {
      throw 'Unable to decode and parse data. Reason: ' + helpers.errors.getMessage(e);
    }
  }
  return { registries, resourceVersion };
}

function putDockerConfig(
  namespace: string,
  registries: RegistryEntry[],
  resourceVersion?: string,
): Promise<api.IDockerConfig> {
  const config: api.IDockerConfig = { dockerconfig: '' };
  try {
    const authInfo = { auths: {} };
    registries.forEach(item => {
      const { url, username, password } = item;
      authInfo.auths[url] = { username, password };
      authInfo.auths[url].auth = window.btoa(username + ':' + password);
    });
    config.dockerconfig = window.btoa(JSON.stringify(authInfo));
    if (resourceVersion) {
      config.resourceVersion = resourceVersion;
    }
    try {
      return DwApi.putDockerConfig(namespace, config);
    } catch (err) {
      throw 'Failed to update the docker cofig. Reason: ' + helpers.errors.getMessage(err);
    }
  } catch (e) {
    throw 'Unable to parse and code data. Reason: ' + helpers.errors.getMessage(e);
  }
}

const unloadedState: State = {
  isLoading: false,
  registries: [],
  resourceVersion: undefined,
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
    case Type.REQUEST_DEVWORKSPACE_CREDENTIALS:
      return createObject<State>(state, {
        isLoading: true,
        error: undefined,
      });
    case Type.SET_DEVWORKSPACE_CREDENTIALS:
      return createObject<State>(state, {
        isLoading: false,
        registries: action.registries,
        resourceVersion: action.resourceVersion,
      });
    case Type.RECEIVE_DEVWORKSPACE_CREDENTIALS_ERROR:
      return createObject<State>(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};
