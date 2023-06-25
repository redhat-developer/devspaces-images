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
import common from '@eclipse-che/common';
import { AppThunk } from '..';
import { fetchRegistryMetadata, fetchDevfile } from '../../services/registry/devfiles';
import { createObject } from '../helpers';
import fetchAndUpdateDevfileSchema from './fetchAndUpdateDevfileSchema';
import devfileApi from '../../services/devfileApi';
import { fetchResources, loadResourcesContent } from '../../services/registry/resources';
import { AUTHORIZED, SanityCheckAction } from '../sanityCheckMiddleware';

export const DEFAULT_REGISTRY = '/dashboard/devfile-registry/';

export type DevWorkspaceResources = [devfileApi.DevWorkspace, devfileApi.DevWorkspaceTemplate];

// This state defines the type of data maintained in the Redux store.
export interface State {
  isLoading: boolean;
  schema: {
    schema?: any;
    error?: string;
  };
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
  REQUEST_SCHEMA = 'REQUEST_SCHEMA',
  RECEIVE_SCHEMA = 'RECEIVE_SCHEMA',
  RECEIVE_SCHEMA_ERROR = 'RECEIVE_SCHEMA_ERROR',
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

export interface RequestSchemaAction extends Action, SanityCheckAction {
  type: Type.REQUEST_SCHEMA;
}

export interface ReceiveSchemaAction {
  type: Type.RECEIVE_SCHEMA;
  schema: any;
}

export interface ReceiveSchemaErrorAction {
  type: Type.RECEIVE_SCHEMA_ERROR;
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
  | RequestSchemaAction
  | ReceiveSchemaAction
  | ReceiveSchemaErrorAction
  | SetFilterValue
  | ClearFilterValue;

export type ActionCreators = {
  requestRegistriesMetadata: (
    location: string,
    isExternal: boolean,
  ) => AppThunk<KnownAction, Promise<void>>;
  requestDevfile: (location: string) => AppThunk<KnownAction, Promise<string>>;
  requestResources: (resourceUrl: string) => AppThunk<KnownAction, Promise<void>>;
  requestJsonSchema: () => AppThunk<KnownAction, any>;

  setFilter: (value: string) => AppThunk<SetFilterValue, void>;
  clearFilter: () => AppThunk<ClearFilterValue, void>;
};

export const actionCreators: ActionCreators = {
  /**
   * Request devfile metadata from available registries. `registryUrls` is space-separated list of urls.
   */
  requestRegistriesMetadata:
    (registryUrls: string, isExternal: boolean): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      await dispatch({ type: Type.REQUEST_REGISTRY_METADATA, check: AUTHORIZED });

      const registries: string[] = registryUrls.split(' ');
      const promises = registries.map(async url => {
        try {
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
    async (dispatch): Promise<string> => {
      await dispatch({ type: Type.REQUEST_DEVFILE, check: AUTHORIZED });
      try {
        const devfile = await fetchDevfile(url);
        dispatch({ type: Type.RECEIVE_DEVFILE, devfile, url });
        return devfile;
      } catch (e) {
        throw new Error(`Failed to request a devfile from URL: ${url}, \n` + e);
      }
    },

  requestResources:
    (resourcesUrl: string): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      await dispatch({ type: Type.REQUEST_RESOURCES, check: AUTHORIZED });

      try {
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

  requestJsonSchema:
    (): AppThunk<KnownAction, any> =>
    async (dispatch): Promise<any> => {
      await dispatch({ type: Type.REQUEST_SCHEMA, check: AUTHORIZED });
      try {
        const schemav200 = await fetchAndUpdateDevfileSchema('2.0.0');
        const schemav210 = await fetchAndUpdateDevfileSchema('2.1.0');
        const schemav220 = await fetchAndUpdateDevfileSchema('2.2.0');
        const schemav221alpha = await fetchAndUpdateDevfileSchema('2.2.1-alpha');

        const schema = {
          oneOf: [schemav200, schemav210, schemav220, schemav221alpha],
        };

        dispatch({
          type: Type.RECEIVE_SCHEMA,
          schema,
        });
        return schema;
      } catch (e) {
        const errorMessage =
          'Failed to request devfile JSON schema, reason: ' + common.helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_SCHEMA_ERROR,
          error: errorMessage,
        });
        throw errorMessage;
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
  schema: {},
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
      return createObject(state, {
        isLoading: true,
      });
    case Type.REQUEST_SCHEMA:
      return createObject(state, {
        isLoading: true,
        schema: {},
      });
    case Type.REQUEST_DEVFILE:
      return createObject(state, {
        isLoading: true,
      });
    case Type.REQUEST_RESOURCES:
      return createObject(state, {
        isLoading: true,
      });
    case Type.RECEIVE_REGISTRY_METADATA:
      return createObject(state, {
        isLoading: false,
        registries: createObject(state.registries, {
          [action.url]: {
            metadata: action.metadata,
          },
        }),
      });
    case Type.RECEIVE_REGISTRY_ERROR:
      return createObject(state, {
        isLoading: false,
        registries: {
          [action.url]: {
            error: action.error,
          },
        },
      });
    case Type.RECEIVE_DEVFILE:
      return createObject(state, {
        isLoading: false,
        devfiles: createObject(state.devfiles, {
          [action.url]: {
            content: action.devfile,
          },
        }),
      });
    case Type.RECEIVE_RESOURCES:
      return createObject(state, {
        isLoading: false,
        devWorkspaceResources: createObject(state.devWorkspaceResources, {
          [action.url]: {
            resources: [action.devWorkspace, action.devWorkspaceTemplate],
          },
        }),
      });
    case Type.RECEIVE_RESOURCES_ERROR:
      return createObject(state, {
        isLoading: false,
        devWorkspaceResources: {
          [action.url]: {
            error: action.error,
          },
        },
      });
    case Type.RECEIVE_SCHEMA:
      return createObject(state, {
        isLoading: false,
        schema: {
          schema: action.schema,
        },
      });
    case Type.RECEIVE_SCHEMA_ERROR:
      return createObject(state, {
        isLoading: false,
        schema: {
          error: action.error,
        },
      });
    case Type.SET_FILTER: {
      return createObject(state, {
        filter: action.value,
      });
    }
    case Type.CLEAR_FILTER: {
      return createObject(state, {
        filter: '',
      });
    }
    default:
      return state;
  }
};
