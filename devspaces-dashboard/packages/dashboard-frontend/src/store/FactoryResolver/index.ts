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
import axios from 'axios';
import common from '@eclipse-che/common';
import { FactoryResolver } from '../../services/helpers/types';
import { container } from '../../inversify.config';
import { CheWorkspaceClient } from '../../services/workspace-client/cheworkspace/cheWorkspaceClient';
import { AppThunk } from '../index';
import { createObject } from '../helpers';
import { selectDefaultComponents, selectPvcStrategy } from '../ServerConfig/selectors';
import devfileApi, { isDevfileV2 } from '../../services/devfileApi';
import { convertDevfileV1toDevfileV2 } from '../../services/devfile/converters';
import normalizeDevfileV2 from './normalizeDevfileV2';
import normalizeDevfileV1 from './normalizeDevfileV1';
import { selectDefaultNamespace } from '../InfrastructureNamespaces/selectors';
import { getYamlResolver } from '../../services/dashboard-backend-client/yamlResolverApi';
import { DEFAULT_REGISTRY } from '../DevfileRegistries';
import { isOAuthResponse } from '../../services/oauth';
import { AUTHORIZED, SanityCheckAction } from '../sanityCheckMiddleware';
import { CHE_EDITOR_YAML_PATH } from '../../services/workspace-client';
import { FactoryParams } from '../../services/helpers/factoryFlow/buildFactoryParams';

const WorkspaceClient = container.get(CheWorkspaceClient);

export type OAuthResponse = {
  attributes: {
    oauth_provider: string;
    oauth_version: string;
    oauth_authentication_url: string;
  };
  errorCode: number;
  message: string | undefined;
};

export interface ResolverState extends FactoryResolver {
  optionalFilesContent?: {
    [fileName: string]: string;
  };
}

export interface ConvertedState {
  resolvedDevfile: devfileApi.Devfile | che.WorkspaceDevfile;
  devfileV2: devfileApi.Devfile;
  isConverted: boolean;
}

export interface State {
  isLoading: boolean;
  resolver?: ResolverState;
  converted?: ConvertedState;
  error?: string;
}

interface RequestFactoryResolverAction extends Action, SanityCheckAction {
  type: 'REQUEST_FACTORY_RESOLVER';
}

interface ReceiveFactoryResolverAction {
  type: 'RECEIVE_FACTORY_RESOLVER';
  resolver: ResolverState;
  converted: ConvertedState;
}

interface ReceiveFactoryResolverErrorAction {
  type: 'RECEIVE_FACTORY_RESOLVER_ERROR';
  error: string | undefined;
}

export type KnownAction =
  | RequestFactoryResolverAction
  | ReceiveFactoryResolverAction
  | ReceiveFactoryResolverErrorAction;

export type ActionCreators = {
  requestFactoryResolver: (
    location: string,
    factoryParams: Partial<FactoryParams>,
  ) => AppThunk<KnownAction, Promise<void>>;
};

export async function grabLink(
  links: api.che.core.rest.Link,
  filename: string,
): Promise<string | undefined> {
  // handle servers not yet providing links
  if (!links || links.length === 0) {
    return undefined;
  }
  // grab the one matching
  const foundLink = links.find(link => link.href.includes(`file=${filename}`));
  if (!foundLink) {
    return undefined;
  }

  const url = new URL(foundLink.href);
  try {
    // load it in raw format
    // see https://github.com/axios/axios/issues/907
    const response = await axios.get<string>(`${url.pathname}${url.search}`, {
      responseType: 'text',
      transformResponse: [
        data => {
          return data;
        },
      ],
    });
    return response.data;
  } catch (error) {
    // content may not be there
    if (common.helpers.errors.isAxiosError(error) && error.response?.status == 404) {
      return undefined;
    }
    throw error;
  }
}

export const actionCreators: ActionCreators = {
  requestFactoryResolver:
    (
      location: string,
      factoryParams: Partial<FactoryParams> = {},
    ): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      await dispatch({ type: 'REQUEST_FACTORY_RESOLVER', check: AUTHORIZED });
      const state = getState();
      const namespace = selectDefaultNamespace(state).name;
      const optionalFilesContent = {};

      const overrideParams = factoryParams
        ? Object.assign({}, factoryParams.overrides, {
            error_code: factoryParams?.errorCode,
          })
        : undefined;
      const isDevfileRegistryLocation = (location: string): boolean => {
        const devfileRegistries = [
          `${window.location.protocol}//${window.location.host}${DEFAULT_REGISTRY}`,
        ];
        if (state.dwServerConfig.config.devfileRegistryURL) {
          devfileRegistries.push(state.dwServerConfig.config.devfileRegistryURL);
        }
        const externalDevfileRegistries =
          state.dwServerConfig.config.devfileRegistry.externalDevfileRegistries.map(
            externalDevfileRegistriy => externalDevfileRegistriy.url,
          );
        if (externalDevfileRegistries.length) {
          devfileRegistries.push(...externalDevfileRegistries);
        }
        return devfileRegistries.some(registry => location.startsWith(registry));
      };

      try {
        let data: FactoryResolver;
        if (isDevfileRegistryLocation(location)) {
          data = await getYamlResolver(namespace, location);
        } else {
          data = await WorkspaceClient.restApiClient.getFactoryResolver<FactoryResolver>(
            location,
            overrideParams,
          );
          const cheEditor = await grabLink(data.links, CHE_EDITOR_YAML_PATH);
          if (cheEditor) {
            optionalFilesContent[CHE_EDITOR_YAML_PATH] = cheEditor;
          }
        }
        if (!data.devfile) {
          throw new Error('The specified link does not contain a valid Devfile.');
        }
        const preferredStorageType = selectPvcStrategy(state) as che.WorkspaceStorageType;
        const isResolvedDevfileV2 = isDevfileV2(data.devfile);
        let devfileV2: devfileApi.Devfile;
        const defaultComponents = selectDefaultComponents(state);
        if (isResolvedDevfileV2) {
          devfileV2 = normalizeDevfileV2(
            data.devfile as devfileApi.DevfileLike,
            data,
            location,
            defaultComponents,
            namespace,
            factoryParams,
          );
        } else {
          const devfileV1 = normalizeDevfileV1(
            data.devfile as che.WorkspaceDevfile,
            preferredStorageType,
          );
          devfileV2 = normalizeDevfileV2(
            await convertDevfileV1toDevfileV2(devfileV1),
            data,
            location,
            defaultComponents,
            namespace,
            factoryParams,
          );
        }
        const converted: ConvertedState = {
          resolvedDevfile: data.devfile,
          isConverted: !isResolvedDevfileV2,
          devfileV2,
        };

        const resolver = { ...data, optionalFilesContent };
        resolver.devfile = devfileV2;
        resolver.location = location;

        dispatch({
          type: 'RECEIVE_FACTORY_RESOLVER',
          resolver,
          converted,
        });
        return;
      } catch (e) {
        if (common.helpers.errors.includesAxiosResponse(e)) {
          const response = e.response;
          if (response.status === 401 && isOAuthResponse(response.data)) {
            throw response.data;
          }
        }
        const errorMessage = common.helpers.errors.getMessage(e);
        dispatch({
          type: 'RECEIVE_FACTORY_RESOLVER_ERROR',
          error: errorMessage,
        });
        throw errorMessage;
      }
    },
};

const unloadedState: State = {
  isLoading: false,
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
    case 'REQUEST_FACTORY_RESOLVER':
      return createObject(state, {
        isLoading: true,
        error: undefined,
      });
    case 'RECEIVE_FACTORY_RESOLVER':
      return createObject(state, {
        isLoading: false,
        resolver: action.resolver,
        converted: action.converted,
      });
    case 'RECEIVE_FACTORY_RESOLVER_ERROR':
      return createObject(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};
