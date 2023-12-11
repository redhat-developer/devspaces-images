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

import { api } from '@eclipse-che/common';
import * as k8s from '@kubernetes/client-node';

import { createError } from '@/devworkspaceClient/services/helpers/createError';
import {
  CoreV1API,
  prepareCoreV1API,
} from '@/devworkspaceClient/services/helpers/prepareCoreV1API';
import { IDevWorkspacePreferencesApi } from '@/devworkspaceClient/types';

const ERROR_LABEL = 'CORE_V1_API_ERROR';
const DEV_WORKSPACE_PREFERENCES_CONFIGMAP = 'workspace-preferences-configmap';

const SKIP_AUTHORIZATION_KEY = 'skip-authorisation';

export class DevWorkspacePreferencesApiService implements IDevWorkspacePreferencesApi {
  private readonly coreV1API: CoreV1API;

  constructor(kc: k8s.KubeConfig) {
    this.coreV1API = prepareCoreV1API(kc);
  }

  async getWorkspacePreferences(namespace: string): Promise<api.IDevWorkspacePreferences> {
    try {
      const response = await this.coreV1API.readNamespacedConfigMap(
        DEV_WORKSPACE_PREFERENCES_CONFIGMAP,
        namespace,
      );
      const data = response.body.data;
      let skipAuthorization: string[];
      if (data === undefined) {
        skipAuthorization = [];
      } else {
        skipAuthorization =
          data[SKIP_AUTHORIZATION_KEY] && data[SKIP_AUTHORIZATION_KEY] !== '[]'
            ? data[SKIP_AUTHORIZATION_KEY].replace(/^\[/, '').replace(/\]$/, '').split(', ')
            : [];
      }

      return Object.assign({}, data, {
        [SKIP_AUTHORIZATION_KEY]: skipAuthorization,
      }) as api.IDevWorkspacePreferences;
    } catch (e) {
      throw createError(e, ERROR_LABEL, 'Unable to get workspace preferences data');
    }
  }

  public async removeProviderFromSkipAuthorizationList(
    namespace: string,
    provider: api.GitProvider,
  ): Promise<void> {
    const devWorkspacePreferences = await this.getWorkspacePreferences(namespace);

    const skipAuthorization = devWorkspacePreferences[SKIP_AUTHORIZATION_KEY].filter(
      (val: string) => val !== provider,
    );
    const skipAuthorizationStr =
      skipAuthorization.length > 0 ? `[${skipAuthorization.sort().join(', ')}]` : '[]';
    const data = Object.assign({}, devWorkspacePreferences, {
      [SKIP_AUTHORIZATION_KEY]: skipAuthorizationStr,
    });

    try {
      await this.coreV1API.patchNamespacedConfigMap(
        DEV_WORKSPACE_PREFERENCES_CONFIGMAP,
        namespace,
        { data },
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          headers: {
            'content-type': k8s.PatchUtils.PATCH_FORMAT_STRATEGIC_MERGE_PATCH,
          },
        },
      );
    } catch (error) {
      const message = `Unable to update workspace preferences in the namespace "${namespace}"`;
      throw createError(undefined, ERROR_LABEL, message);
    }
  }
}
