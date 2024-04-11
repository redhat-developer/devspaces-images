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

import common from '@eclipse-che/common';

import { getFactoryResolver } from '@/services/backend-client/factoryApi';
import { getYamlResolver } from '@/services/backend-client/yamlResolverApi';
import { FactoryParams } from '@/services/helpers/factoryFlow/buildFactoryParams';
import { FactoryResolver } from '@/services/helpers/types';
import { isOAuthResponse } from '@/services/oauth';
import { CHE_EDITOR_YAML_PATH } from '@/services/workspace-client/helpers';
import {
  grabLink,
  isDevfileRegistryLocation,
  normalizeDevfile,
} from '@/store/FactoryResolver/helpers';
import { ActionCreators, KnownAction, Type } from '@/store/FactoryResolver/types';
import { AppThunk } from '@/store/index';
import { selectDefaultNamespace } from '@/store/InfrastructureNamespaces/selectors';
import { selectAsyncIsAuthorized, selectSanityCheckError } from '@/store/SanityCheck/selectors';
import { AUTHORIZED } from '@/store/sanityCheckMiddleware';
import { selectDefaultComponents } from '@/store/ServerConfig/selectors';

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

      try {
        await dispatch({
          type: Type.REQUEST_FACTORY_RESOLVER,
          check: AUTHORIZED,
        });
        if (!(await selectAsyncIsAuthorized(getState()))) {
          const error = selectSanityCheckError(getState());
          throw new Error(error);
        }
        let data: FactoryResolver;

        if (isDevfileRegistryLocation(location, state.dwServerConfig.config)) {
          data = await getYamlResolver(location);
        } else {
          data = await getFactoryResolver(location, overrideParams);
          const cheEditor = await grabLink(data.links || [], CHE_EDITOR_YAML_PATH);
          if (cheEditor) {
            optionalFilesContent[CHE_EDITOR_YAML_PATH] = cheEditor;
          }
        }

        if (!data.devfile) {
          throw new Error('The specified link does not contain any Devfile.');
        }

        const defaultComponents = selectDefaultComponents(state);
        const devfile = normalizeDevfile(
          data,
          location,
          defaultComponents,
          namespace,
          factoryParams,
        );

        const resolver = {
          ...data,
          devfile: devfile,
          location,
          optionalFilesContent,
        };

        dispatch({
          type: Type.RECEIVE_FACTORY_RESOLVER,
          resolver,
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
          type: Type.RECEIVE_FACTORY_RESOLVER_ERROR,
          error: errorMessage,
        });
        throw errorMessage;
      }
    },
};
