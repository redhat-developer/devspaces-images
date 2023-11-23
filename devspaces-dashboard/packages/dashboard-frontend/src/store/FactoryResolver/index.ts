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

import * as cheApi from '@eclipse-che/api';
import common from '@eclipse-che/common';
import axios from 'axios';
import { Action, Reducer } from 'redux';

import { getFactoryResolver } from '@/services/backend-client/factoryApi';
import { getYamlResolver } from '@/services/backend-client/yamlResolverApi';
import { convertDevfileV1toDevfileV2 } from '@/services/devfile/converters';
import devfileApi, { isDevfileV2 } from '@/services/devfileApi';
import { FactoryParams } from '@/services/helpers/factoryFlow/buildFactoryParams';
import { FactoryResolver } from '@/services/helpers/types';
import { isOAuthResponse } from '@/services/oauth';
import { CHE_EDITOR_YAML_PATH } from '@/services/workspace-client/helpers';
import { DEFAULT_REGISTRY } from '@/store/DevfileRegistries';
import normalizeDevfileV1 from '@/store/FactoryResolver/normalizeDevfileV1';
import normalizeDevfileV2 from '@/store/FactoryResolver/normalizeDevfileV2';
import { createObject } from '@/store/helpers';
import { AppThunk } from '@/store/index';
import { selectDefaultNamespace } from '@/store/InfrastructureNamespaces/selectors';
import { selectAsyncIsAuthorized, selectSanityCheckError } from '@/store/SanityCheck/selectors';
import { AUTHORIZED, SanityCheckAction } from '@/store/sanityCheckMiddleware';
import { selectDefaultComponents, selectPvcStrategy } from '@/store/ServerConfig/selectors';

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
  links: cheApi.che.core.rest.Link[],
  filename: string,
): Promise<string | undefined> {
  // handle servers not yet providing links
  if (!links || links.length === 0) {
    return undefined;
  }
  // grab the one matching
  const foundLink = links.find(link => link.href?.includes(`file=${filename}`));
  if (!foundLink || !foundLink.href) {
    return undefined;
  }

  const url = new URL(foundLink.href);
  let search = '?';
  url.searchParams.forEach((value, key) => {
    search += `${key}=${encodeURIComponent(encodeURI(value))}&`;
  });
  search = search.slice(0, -1);

  try {
    // load it in raw format
    // see https://github.com/axios/axios/issues/907
    const response = await axios.get<string>(`${url.pathname}${search}`, {
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
        await dispatch({ type: 'REQUEST_FACTORY_RESOLVER', check: AUTHORIZED });
        if (!(await selectAsyncIsAuthorized(getState()))) {
          const error = selectSanityCheckError(getState());
          throw new Error(error);
        }
        let data: FactoryResolver;
        if (isDevfileRegistryLocation(location)) {
          data = await getYamlResolver(namespace, location);
        } else {
          data = await getFactoryResolver(location, overrideParams);
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
      return createObject<State>(state, {
        isLoading: true,
        error: undefined,
      });
    case 'RECEIVE_FACTORY_RESOLVER':
      return createObject<State>(state, {
        isLoading: false,
        resolver: action.resolver,
        converted: action.converted,
      });
    case 'RECEIVE_FACTORY_RESOLVER_ERROR':
      return createObject<State>(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};
