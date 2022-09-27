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
import axios from 'axios';
import common from '@eclipse-che/common';
import { FactoryResolver } from '../../services/helpers/types';
import { container } from '../../inversify.config';
import { CheWorkspaceClient } from '../../services/workspace-client/cheworkspace/cheWorkspaceClient';
import { AppThunk } from '../index';
import { createObject } from '../helpers';
import { selectDefaultComponents, selectPvcStrategy } from '../ServerConfig/selectors';
import { Devfile } from '../../services/workspace-adapter';
import devfileApi, { isDevfileV2 } from '../../services/devfileApi';
import { convertDevfileV1toDevfileV2 } from '../../services/devfile/converters';
import normalizeDevfileV2 from './normalizeDevfileV2';
import normalizeDevfileV1 from './normalizeDevfileV1';
import { selectDefaultNamespace } from '../InfrastructureNamespaces/selectors';
import { getYamlResolver } from '../../services/dashboard-backend-client/yamlResolverApi';
import { DEFAULT_REGISTRY } from '../DevfileRegistries';

const WorkspaceClient = container.get(CheWorkspaceClient);

export type OAuthResponse = {
  attributes: {
    oauth_provider: string;
    oauth_version: string;
    oauth_authentication_url: string;
  };
  errorCode: number;
  message: string;
};

export function isOAuthResponse(responseData: any): responseData is OAuthResponse {
  if (
    responseData?.attributes?.oauth_provider &&
    responseData?.attributes?.oauth_authentication_url
  ) {
    return true;
  }
  return false;
}
export interface ResolverState extends FactoryResolver {
  optionalFilesContent?: {
    [fileName: string]: string;
  };
}

export interface ConvertedState {
  resolvedDevfile: Devfile;
  devfileV2: devfileApi.Devfile;
  isConverted: boolean;
}

export interface State {
  isLoading: boolean;
  resolver?: ResolverState;
  converted?: ConvertedState;
  error?: string;
}

interface RequestFactoryResolverAction {
  type: 'REQUEST_FACTORY_RESOLVER';
}

interface ReceiveFactoryResolverAction {
  type: 'RECEIVE_FACTORY_RESOLVER';
  resolver: ResolverState;
  converted: ConvertedState;
}

interface ReceiveFactoryResolverErrorAction {
  type: 'RECEIVE_FACTORY_RESOLVER_ERROR';
  error: string;
}

export type KnownAction =
  | RequestFactoryResolverAction
  | ReceiveFactoryResolverAction
  | ReceiveFactoryResolverErrorAction;

export type ActionCreators = {
  requestFactoryResolver: (
    location: string,
    overrideParams?: { [params: string]: string },
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
      overrideParams?: { [params: string]: string },
    ): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      dispatch({ type: 'REQUEST_FACTORY_RESOLVER' });
      const state = getState();
      const namespace = selectDefaultNamespace(state).name;
      const optionalFilesContent = {};

      try {
        await WorkspaceClient.restApiClient.provisionKubernetesNamespace();

        let data: FactoryResolver;

        if (location.includes(DEFAULT_REGISTRY) && location.endsWith('.yaml')) {
          data = await getYamlResolver(namespace, location);
        } else {
          data = await WorkspaceClient.restApiClient.getFactoryResolver<FactoryResolver>(
            location,
            overrideParams,
          );
          // now, grab content of optional files if they're there
          const vscodeExtensionsJson = await grabLink(data.links, '.vscode/extensions.json');
          if (vscodeExtensionsJson) {
            optionalFilesContent['.vscode/extensions.json'] = vscodeExtensionsJson;
          }
          const cheTheiaPlugins = await grabLink(data.links, '.che/che-theia-plugins.yaml');
          if (cheTheiaPlugins) {
            optionalFilesContent['.che/che-theia-plugins.yaml'] = cheTheiaPlugins;
          }
          const cheEditor = await grabLink(data.links, '.che/che-editor.yaml');
          if (cheEditor) {
            optionalFilesContent['.che/che-editor.yaml'] = cheEditor;
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
        const errorMessage =
          'Failed to request factory resolver: ' + common.helpers.errors.getMessage(e);
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
