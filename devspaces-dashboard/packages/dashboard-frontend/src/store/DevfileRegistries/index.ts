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

import common from '@eclipse-che/common';
import { Action, Reducer } from 'redux';

import devfileApi from '@/services/devfileApi';
import { fetchDevfile, fetchRegistryMetadata } from '@/services/registry/devfiles';
import { fetchResources, loadResourcesContent } from '@/services/registry/resources';
import { createObject } from '@/store/helpers';
import { selectAsyncIsAuthorized, selectSanityCheckError } from '@/store/SanityCheck/selectors';
import { AUTHORIZED, SanityCheckAction } from '@/store/sanityCheckMiddleware';

import { AppThunk } from '..';

export const DEFAULT_REGISTRY = '/dashboard/devfile-registry/';

export type DevWorkspaceResources = [devfileApi.DevWorkspace, devfileApi.DevWorkspaceTemplate];

// This state defines the type of data maintained in the Redux store.
export interface State {
  isLoading: boolean;
  registries: {
    [location: string]: {
      metadata?: che.DevfileMetaData[];
      error?: string;
    };
  };
  devfiles: {
    [location: string]: {
      content?: string;
      error?: string;
    };
  };
  devWorkspaceResources: {
    [location: string]: {
      resources?: DevWorkspaceResources;
      error?: string;
    };
  };

  // current filter value
  filter: string;
}

export enum Type {
  REQUEST_REGISTRY_METADATA = 'REQUEST_REGISTRY_METADATA',
  RECEIVE_REGISTRY_METADATA = 'RECEIVE_REGISTRY_METADATA',
  RECEIVE_REGISTRY_ERROR = 'RECEIVE_REGISTRY_ERROR',
  REQUEST_DEVFILE = 'REQUEST_DEVFILE',
  RECEIVE_DEVFILE = 'RECEIVE_DEVFILE',
  REQUEST_RESOURCES = 'REQUEST_RESOURCES',
  RECEIVE_RESOURCES = 'RECEIVE_RESOURCES',
  RECEIVE_RESOURCES_ERROR = 'RECEIVE_RESOURCES_ERROR',
  SET_FILTER = 'SET_FILTER',
  CLEAR_FILTER = 'CLEAR_FILTER',
}

export interface RequestRegistryMetadataAction extends Action, SanityCheckAction {
  type: Type.REQUEST_REGISTRY_METADATA;
}

export interface ReceiveRegistryMetadataAction {
  type: Type.RECEIVE_REGISTRY_METADATA;
  url: string;
  metadata: che.DevfileMetaData[];
}

export interface ReceiveRegistryErrorAction {
  type: Type.RECEIVE_REGISTRY_ERROR;
  url: string;
  error: string;
}

export interface RequestDevfileAction extends Action, SanityCheckAction {
  type: Type.REQUEST_DEVFILE;
}

export interface ReceiveDevfileAction {
  type: Type.RECEIVE_DEVFILE;
  url: string;
  devfile: string;
}

export interface RequestResourcesAction extends Action, SanityCheckAction {
  type: Type.REQUEST_RESOURCES;
}

export interface ReceiveResourcesAction {
  type: Type.RECEIVE_RESOURCES;
  url: string;
  devWorkspace: devfileApi.DevWorkspace;
  devWorkspaceTemplate: devfileApi.DevWorkspaceTemplate;
}

export interface ReceiveResourcesErrorAction {
  type: Type.RECEIVE_RESOURCES_ERROR;
  url: string;
  error: string;
}

export interface SetFilterValue extends Action {
  type: Type.SET_FILTER;
  value: string;
}

export interface ClearFilterValue extends Action {
  type: Type.CLEAR_FILTER;
}

export type KnownAction =
  | RequestRegistryMetadataAction
  | ReceiveRegistryMetadataAction
  | ReceiveRegistryErrorAction
  | RequestDevfileAction
  | ReceiveDevfileAction
  | RequestResourcesAction
  | ReceiveResourcesAction
  | ReceiveResourcesErrorAction
  | SetFilterValue
  | ClearFilterValue;

export type ActionCreators = {
  requestRegistriesMetadata: (
    location: string,
    isExternal: boolean,
  ) => AppThunk<KnownAction, Promise<void>>;
  requestDevfile: (location: string) => AppThunk<KnownAction, Promise<string>>;
  requestResources: (resourceUrl: string) => AppThunk<KnownAction, Promise<void>>;

  setFilter: (value: string) => AppThunk<SetFilterValue, void>;
  clearFilter: () => AppThunk<ClearFilterValue, void>;
};

export const actionCreators: ActionCreators = {
  /**
   * Request devfile metadata from available registries. `registryUrls` is space-separated list of urls.
   */
  requestRegistriesMetadata:
    (registryUrls: string, isExternal: boolean): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      const registries: string[] = registryUrls.split(' ');
      const promises = registries.map(async url => {
        try {
          await dispatch({ type: Type.REQUEST_REGISTRY_METADATA, check: AUTHORIZED });
          if (!(await selectAsyncIsAuthorized(getState()))) {
            const error = selectSanityCheckError(getState());
            throw new Error(error);
          }
          const metadata: che.DevfileMetaData[] = await fetchRegistryMetadata(url, isExternal);
          if (!Array.isArray(metadata) || metadata.length === 0) {
            return;
          }
          dispatch({
            type: Type.RECEIVE_REGISTRY_METADATA,
            url,
            metadata,
          });
        } catch (e) {
          const error = common.helpers.errors.getMessage(e);
          dispatch({
            type: Type.RECEIVE_REGISTRY_ERROR,
            url,
            error,
          });
          throw error;
        }
      });
      const results = await Promise.allSettled(promises);
      results.forEach(result => {
        if (result.status === 'rejected') {
          throw result.reason;
        }
      });
    },

  requestDevfile:
    (url: string): AppThunk<KnownAction, Promise<string>> =>
    async (dispatch, getState): Promise<string> => {
      try {
        await dispatch({ type: Type.REQUEST_DEVFILE, check: AUTHORIZED });
        if (!(await selectAsyncIsAuthorized(getState()))) {
          const error = selectSanityCheckError(getState());
          throw new Error(error);
        }
        const devfile = await fetchDevfile(url);
        dispatch({ type: Type.RECEIVE_DEVFILE, devfile, url });
        return devfile;
      } catch (e) {
        throw new Error(`Failed to request a devfile from URL: ${url}, \n` + e);
      }
    },

  requestResources:
    (resourcesUrl: string): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      try {
        await dispatch({ type: Type.REQUEST_RESOURCES, check: AUTHORIZED });
        if (!(await selectAsyncIsAuthorized(getState()))) {
          const error = selectSanityCheckError(getState());
          throw new Error(error);
        }
        const resourcesContent = await fetchResources(resourcesUrl);
        const resources = loadResourcesContent(resourcesContent);

        const devWorkspace = resources.find(
          resource => resource.kind === 'DevWorkspace',
        ) as devfileApi.DevWorkspace;
        if (!devWorkspace) {
          throw new Error('Failed to find a DevWorkspace in the fetched resources.');
        }

        const devWorkspaceTemplate = resources.find(
          resource => resource.kind === 'DevWorkspaceTemplate',
        ) as devfileApi.DevWorkspaceTemplate;
        if (!devWorkspaceTemplate) {
          throw new Error('Failed to find a DevWorkspaceTemplate in the fetched resources.');
        }

        dispatch({
          type: Type.RECEIVE_RESOURCES,
          url: resourcesUrl,
          devWorkspace,
          devWorkspaceTemplate,
        });
      } catch (e) {
        const message =
          'Failed to fetch devworkspace resources. ' + common.helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_RESOURCES_ERROR,
          url: resourcesUrl,
          error: message,
        });
        throw new Error(message);
      }
    },

  setFilter:
    (value: string): AppThunk<SetFilterValue, void> =>
    dispatch => {
      dispatch({ type: Type.SET_FILTER, value });
    },

  clearFilter: (): AppThunk<ClearFilterValue, void> => dispatch => {
    dispatch({ type: Type.CLEAR_FILTER });
  },
};

const unloadedState: State = {
  isLoading: false,
  registries: {},
  devfiles: {},
  devWorkspaceResources: {},

  filter: '',
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
    case Type.REQUEST_REGISTRY_METADATA:
      return createObject<State>(state, {
        isLoading: true,
      });
    case Type.REQUEST_DEVFILE:
      return createObject<State>(state, {
        isLoading: true,
      });
    case Type.REQUEST_RESOURCES:
      return createObject<State>(state, {
        isLoading: true,
      });
    case Type.RECEIVE_REGISTRY_METADATA:
      return createObject<State>(state, {
        isLoading: false,
        registries: createObject(state.registries, {
          [action.url]: {
            metadata: action.metadata,
          },
        }),
      });
    case Type.RECEIVE_REGISTRY_ERROR:
      return createObject<State>(state, {
        isLoading: false,
        registries: {
          [action.url]: {
            error: action.error,
          },
        },
      });
    case Type.RECEIVE_DEVFILE:
      return createObject<State>(state, {
        isLoading: false,
        devfiles: createObject(state.devfiles, {
          [action.url]: {
            content: action.devfile,
          },
        }),
      });
    case Type.RECEIVE_RESOURCES:
      return createObject<State>(state, {
        isLoading: false,
        devWorkspaceResources: createObject(state.devWorkspaceResources, {
          [action.url]: {
            resources: [action.devWorkspace, action.devWorkspaceTemplate],
          },
        }),
      });
    case Type.RECEIVE_RESOURCES_ERROR:
      return createObject<State>(state, {
        isLoading: false,
        devWorkspaceResources: {
          [action.url]: {
            error: action.error,
          },
        },
      });
    case Type.SET_FILTER: {
      return createObject<State>(state, {
        filter: action.value,
      });
    }
    case Type.CLEAR_FILTER: {
      return createObject<State>(state, {
        filter: '',
      });
    }
    default:
      return state;
  }
};
