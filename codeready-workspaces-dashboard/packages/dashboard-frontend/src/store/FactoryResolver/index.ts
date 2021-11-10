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
import { RequestError } from '@eclipse-che/workspace-client';
import axios, { AxiosResponse } from 'axios';
import common from '@eclipse-che/common';
import { FactoryResolver } from '../../services/helpers/types';
import { container } from '../../inversify.config';
import { CheWorkspaceClient } from '../../services/workspace-client/cheworkspace/cheWorkspaceClient';
import { AppThunk } from '../index';
import { createObject } from '../helpers';
import { getDevfile } from './getDevfile';

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

export function isOAuthResponse(response: any): response is OAuthResponse {
  if (response?.attributes?.oauth_provider && response?.attributes?.oauth_authentication_url) {
    return true;
  }
  return false;
}
export interface ResolverState {
  location?: string;
  source?: string;
  devfile?: api.che.workspace.devfile.Devfile;
  scm_info?: {
    clone_url: string;
    scm_provider: string;
    branch?: string;
  };
  optionalFilesContent?: {
    [fileName: string]: string;
  };
}

export interface State {
  isLoading: boolean;
  resolver: ResolverState;
  error?: string;
}

interface RequestFactoryResolverAction {
  type: 'REQUEST_FACTORY_RESOLVER';
}

interface ReceiveFactoryResolverAction {
  type: 'RECEIVE_FACTORY_RESOLVER';
  resolver: ResolverState;
}

interface ReceiveFactoryResolverErrorAction {
  type: 'RECEIVE_FACTORY_RESOLVER_ERROR';
  error: string;
}

type KnownAction =
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

  // remove first part of the link until /api (to avoid the full links and use only relative links)
  const href = foundLink.href.substring(foundLink.href.indexOf('/api/scm'));
  try {
    // load it in raw format
    // see https://github.com/axios/axios/issues/907
    const response = await axios.get<string>(href, {
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
    async (dispatch): Promise<void> => {
      dispatch({ type: 'REQUEST_FACTORY_RESOLVER' });

      try {
        await WorkspaceClient.restApiClient.provisionKubernetesNamespace();
        const data = await WorkspaceClient.restApiClient.getFactoryResolver<FactoryResolver>(
          location,
          overrideParams,
        );
        if (!data.devfile) {
          throw 'The specified link does not contain a valid Devfile.';
        }
        // now, grab content of optional files if they're there
        const optionalFilesContent = {};
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
        const devfile = getDevfile(data, location);

        const { source, scm_info } = data;
        dispatch({
          type: 'RECEIVE_FACTORY_RESOLVER',
          resolver: { location, devfile, source, scm_info, optionalFilesContent },
        });
        return;
      } catch (e) {
        const error = e as RequestError;
        const response = error.response as AxiosResponse;
        const responseData = response.data;
        if (response.status === 401 && isOAuthResponse(responseData)) {
          throw responseData;
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
  resolver: {},
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
