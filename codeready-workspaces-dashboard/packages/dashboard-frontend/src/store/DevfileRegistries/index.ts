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

interface RequestRegistryMetadataAction {
  type: 'REQUEST_REGISTRY_METADATA';
}

interface ReceiveRegistryMetadataAction {
  type: 'RECEIVE_REGISTRY_METADATA';
  url: string;
  metadata: che.DevfileMetaData[];
}

interface ReceiveRegistryErrorAction {
  type: 'RECEIVE_REGISTRY_ERROR';
  url: string;
  error: string;
}

interface RequestDevfileAction {
  type: 'REQUEST_DEVFILE';
}

interface ReceiveDevfileAction {
  type: 'RECEIVE_DEVFILE';
  url: string;
  devfile: string;
}

interface RequestSchemaAction {
  type: 'REQUEST_SCHEMA';
}

interface ReceiveSchemaAction {
  type: 'RECEIVE_SCHEMA';
  schema: any;
}

interface ReceiveSchemaErrorAction {
  type: 'RECEIVE_SCHEMA_ERROR';
  error: string;
}

interface SetFilterValue extends Action {
  type: 'SET_FILTER';
  value: string;
}

interface ClearFilterValue extends Action {
  type: 'CLEAR_FILTER';
}

type KnownAction =
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
      dispatch({ type: 'REQUEST_REGISTRY_METADATA' });
      const promises = registryUrls.split(' ').map(async url => {
        try {
          const metadata = await fetchRegistryMetadata(url);
          dispatch({
            type: 'RECEIVE_REGISTRY_METADATA',
            url,
            metadata,
          });
        } catch (e) {
          const error = common.helpers.errors.getMessage(e);
          dispatch({
            type: 'RECEIVE_REGISTRY_ERROR',
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
      dispatch({ type: 'REQUEST_DEVFILE' });
      try {
        const devfile = await fetchDevfile(url);
        dispatch({ type: 'RECEIVE_DEVFILE', devfile, url });
        return devfile;
      } catch (e) {
        throw new Error(`Failed to request a devfile from URL: ${url}, \n` + e);
      }
    },

  requestJsonSchema:
    (): AppThunk<KnownAction, any> =>
    async (dispatch, getState): Promise<any> => {
      dispatch({ type: 'REQUEST_SCHEMA' });
      try {
        const state = getState();
        const schemav1 = await WorkspaceClient.restApiClient.getDevfileSchema<{
          [key: string]: any;
        }>('1.0.0');
        const items = selectPlugins(state);
        const components = schemav1?.properties ? schemav1.properties.components : undefined;
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
          const patchedJSONString = JSON.stringify(schemav1).replaceAll(
            '#/definitions',
            '#/oneOf/0/definitions',
          );
          const parsedSchemaV1 = JSON.parse(patchedJSONString);

          const schemav200 = await WorkspaceClient.restApiClient.getDevfileSchema('2.0.0');
          const schemav210 = await WorkspaceClient.restApiClient.getDevfileSchema('2.1.0');
          const schemav220alpha = await WorkspaceClient.restApiClient.getDevfileSchema('2.2.0');
          schema = {
            oneOf: [parsedSchemaV1, schemav200, schemav210, schemav220alpha],
          };
        }

        dispatch({
          type: 'RECEIVE_SCHEMA',
          schema,
        });
        return schema;
      } catch (e) {
        const errorMessage =
          'Failed to request devfile JSON schema, reason: ' + common.helpers.errors.getMessage(e);
        dispatch({
          type: 'RECEIVE_SCHEMA_ERROR',
          error: errorMessage,
        });
        throw errorMessage;
      }
    },

  setFilter:
    (value: string): AppThunk<SetFilterValue, void> =>
    dispatch => {
      dispatch({ type: 'SET_FILTER', value });
    },

  clearFilter: (): AppThunk<ClearFilterValue, void> => dispatch => {
    dispatch({ type: 'CLEAR_FILTER' });
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
    case 'REQUEST_REGISTRY_METADATA':
      return createObject(state, {
        isLoading: true,
        registries: {},
      });
    case 'REQUEST_SCHEMA':
      return createObject(state, {
        isLoading: true,
        schema: {},
      });
    case 'REQUEST_DEVFILE':
      return createObject(state, {
        isLoading: true,
      });
    case 'RECEIVE_REGISTRY_METADATA':
      return createObject(state, {
        isLoading: false,
        registries: createObject(state.registries, {
          [action.url]: {
            metadata: action.metadata,
          },
        }),
      });
    case 'RECEIVE_REGISTRY_ERROR':
      return createObject(state, {
        isLoading: false,
        registries: {
          [action.url]: {
            error: action.error,
          },
        },
      });
    case 'RECEIVE_DEVFILE':
      return createObject(state, {
        isLoading: false,
        devfiles: {
          [action.url]: {
            content: action.devfile,
          },
        },
      });
    case 'RECEIVE_SCHEMA':
      return createObject(state, {
        isLoading: false,
        schema: {
          schema: action.schema,
        },
      });
    case 'RECEIVE_SCHEMA_ERROR':
      return createObject(state, {
        isLoading: false,
        schema: {
          error: action.error,
        },
      });
    case 'SET_FILTER': {
      return createObject(state, {
        filter: action.value,
      });
    }
    case 'CLEAR_FILTER': {
      return createObject(state, {
        filter: '',
      });
    }
    default:
      return state;
  }
};
