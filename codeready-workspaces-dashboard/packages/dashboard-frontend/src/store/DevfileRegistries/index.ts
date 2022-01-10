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
import common from '@eclipse-che/common';
import { AppThunk } from '..';
import { fetchRegistryMetadata, fetchDevfile } from '../../services/registry/devfiles';
import { createObject } from '../helpers';
import { container } from '../../inversify.config';
import { CheWorkspaceClient } from '../../services/workspace-client/cheworkspace/cheWorkspaceClient';
import { selectPlugins } from '../Plugins/chePlugins/selectors';
import { isDevworkspacesEnabled } from '../../services/helpers/devworkspace';
import fetchAndUpdateDevfileSchema from './fetchAndUpdateDevfileSchema';

const WorkspaceClient = container.get(CheWorkspaceClient);

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

  // current filter value
  filter: string;
}

export enum Type {
  REQUEST_REGISTRY_METADATA = 'REQUEST_REGISTRY_METADATA',
  RECEIVE_REGISTRY_METADATA = 'RECEIVE_REGISTRY_METADATA',
  RECEIVE_REGISTRY_ERROR = 'RECEIVE_REGISTRY_ERROR',
  REQUEST_DEVFILE = 'REQUEST_DEVFILE',
  RECEIVE_DEVFILE = 'RECEIVE_DEVFILE',
  REQUEST_SCHEMA = 'REQUEST_SCHEMA',
  RECEIVE_SCHEMA = 'RECEIVE_SCHEMA',
  RECEIVE_SCHEMA_ERROR = 'RECEIVE_SCHEMA_ERROR',
  UPDATE_PREBUILT_TEMPLATES = 'UPDATE_PREBUILT_TEMPLATES',
  SET_FILTER = 'SET_FILTER',
  CLEAR_FILTER = 'CLEAR_FILTER',
}

export interface RequestRegistryMetadataAction {
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

export interface RequestDevfileAction {
  type: Type.REQUEST_DEVFILE;
}

export interface ReceiveDevfileAction {
  type: Type.RECEIVE_DEVFILE;
  url: string;
  devfile: string;
}

export interface RequestSchemaAction {
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
  | RequestSchemaAction
  | ReceiveSchemaAction
  | ReceiveSchemaErrorAction
  | SetFilterValue
  | ClearFilterValue;

export type ActionCreators = {
  requestRegistriesMetadata: (location: string) => AppThunk<KnownAction, Promise<void>>;
  requestDevfile: (Location: string) => AppThunk<KnownAction, Promise<string>>;
  requestJsonSchema: () => AppThunk<KnownAction, any>;

  setFilter: (value: string) => AppThunk<SetFilterValue, void>;
  clearFilter: () => AppThunk<ClearFilterValue, void>;
};

export const actionCreators: ActionCreators = {
  /**
   * Request devfile metadata from available registries. `registryUrls` is space-separated list of urls.
   */
  requestRegistriesMetadata:
    (registryUrls: string): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      dispatch({ type: Type.REQUEST_REGISTRY_METADATA });

      const promises = registryUrls.split(' ').map(async url => {
        try {
          const metadata = await fetchRegistryMetadata(url);
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
      dispatch({ type: Type.REQUEST_DEVFILE });
      try {
        const devfile = await fetchDevfile(url);
        dispatch({ type: Type.RECEIVE_DEVFILE, devfile, url });
        return devfile;
      } catch (e) {
        throw new Error(`Failed to request a devfile from URL: ${url}, \n` + e);
      }
    },

  requestJsonSchema:
    (): AppThunk<KnownAction, any> =>
    async (dispatch, getState): Promise<any> => {
      dispatch({ type: Type.REQUEST_SCHEMA });
      try {
        const state = getState();
        const schemav1 = await WorkspaceClient.restApiClient.getDevfileSchema<{
          [key: string]: any;
        }>('1.0.0');
        const items = selectPlugins(state);
        const components = schemav1?.properties?.components;
        if (components) {
          const mountSources = components.items.properties.mountSources;
          // mount sources is specific only for some of component types but always appears
          // patch schema and remove default value for boolean mount sources to avoid their appearing during the completion
          if (mountSources && mountSources.default === 'false') {
            delete mountSources.default;
          }
          schemav1.additionalProperties = true;
          if (!components.defaultSnippets) {
            components.defaultSnippets = [];
          }
          const pluginsId: string[] = [];
          items.forEach((item: che.Plugin) => {
            const id = `${item.publisher}/${item.name}/latest`;
            if (pluginsId.indexOf(id) === -1 && item.type !== 'Che Editor') {
              pluginsId.push(id);
              components.defaultSnippets.push({
                label: item.displayName,
                description: item.description,
                body: { id: id, type: 'chePlugin' },
              });
            } else {
              pluginsId.push(item.id);
            }
          });
          if (components.items && components.items.properties) {
            if (!components.items.properties.id) {
              components.items.properties.id = {
                type: 'string',
                description: 'Plugin/Editor id.',
              };
            }
            components.items.properties.id.examples = pluginsId;
          }
        }

        let schema = schemav1;

        const cheDevworkspaceEnabled = isDevworkspacesEnabled(state.workspacesSettings.settings);
        if (cheDevworkspaceEnabled) {
          // This makes $ref resolve against the first schema, otherwise the yaml language server will report errors
          const patchedJSONString = JSON.stringify(schemav1).replace(
            /#\/definitions/g,
            '#/oneOf/0/definitions',
          );
          const parsedSchemaV1 = JSON.parse(patchedJSONString);

          const schemav200 = await fetchAndUpdateDevfileSchema(WorkspaceClient, '2.0.0');
          const schemav210 = await fetchAndUpdateDevfileSchema(WorkspaceClient, '2.1.0');
          const schemav220 = await fetchAndUpdateDevfileSchema(WorkspaceClient, '2.2.0');

          schema = {
            oneOf: [parsedSchemaV1, schemav200, schemav210, schemav220],
          };
        }

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
        registries: {},
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
        devfiles: {
          [action.url]: {
            content: action.devfile,
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
