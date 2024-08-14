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

import { api } from '@eclipse-che/common';
import * as k8s from '@kubernetes/client-node';

import { createError } from '@/devworkspaceClient/services/helpers/createError';
import {
  CoreV1API,
  prepareCoreV1API,
} from '@/devworkspaceClient/services/helpers/prepareCoreV1API';
import { IWorkspacePreferencesApi } from '@/devworkspaceClient/types';

const ERROR_LABEL = 'CORE_V1_API_ERROR';
export const DEV_WORKSPACE_PREFERENCES_CONFIGMAP = 'workspace-preferences-configmap';

export const SKIP_AUTHORIZATION_KEY = 'skip-authorisation';
export const TRUSTED_SOURCES_KEY = 'trusted-sources';

export class WorkspacePreferencesApiService implements IWorkspacePreferencesApi {
  private readonly coreV1API: CoreV1API;

  constructor(kc: k8s.KubeConfig) {
    this.coreV1API = prepareCoreV1API(kc);
  }

  async getWorkspacePreferences(namespace: string): Promise<api.IWorkspacePreferences> {
    try {
      const response = await this.coreV1API.readNamespacedConfigMap(
        DEV_WORKSPACE_PREFERENCES_CONFIGMAP,
        namespace,
      );
      const data = response.body.data || {};

      if (!data[SKIP_AUTHORIZATION_KEY]) {
        data[SKIP_AUTHORIZATION_KEY] = '[]';
      }

      const preferences = Object.keys(data).reduce((acc, key) => {
        if (key === SKIP_AUTHORIZATION_KEY) {
          if (data[key] === '[]') {
            acc[key] = [];
          } else {
            const providers = data[key].replace('[', '').replace(']', '').split(/,\s+/);
            acc[key] = providers as api.GitProvider[];
          }
        } else {
          acc[key] = JSON.parse(data[key]);
        }
        return acc;
      }, {} as api.IWorkspacePreferences);

      return preferences;
    } catch (e) {
      throw createError(e, ERROR_LABEL, 'Unable to get workspace preferences data');
    }
  }

  private async updateWorkspacePreferences(
    namespace: string,
    updatedData: api.IWorkspacePreferences,
  ): Promise<void> {
    const data = Object.keys(updatedData).reduce(
      (acc, key) => {
        if (key === SKIP_AUTHORIZATION_KEY) {
          acc[key] = '[' + updatedData[key].join(', ') + ']';
        } else {
          acc[key] = JSON.stringify(updatedData[key]);
        }
        return acc;
      },
      {} as Record<string, string>,
    );
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

  public async removeProviderFromSkipAuthorizationList(
    namespace: string,
    provider: api.GitProvider,
  ): Promise<void> {
    const devWorkspacePreferences = await this.getWorkspacePreferences(namespace);

    const skipAuthorization = devWorkspacePreferences[SKIP_AUTHORIZATION_KEY].filter(
      (val: string) => val !== provider,
    );

    const data = Object.assign({}, devWorkspacePreferences, {
      [SKIP_AUTHORIZATION_KEY]: skipAuthorization,
    });

    await this.updateWorkspacePreferences(namespace, data);
  }

  public async addTrustedSource(
    namespace: string,
    trustedSource: api.TrustedSourceAll | api.TrustedSourceUrl,
  ): Promise<void> {
    const devWorkspacePreferences = await this.getWorkspacePreferences(namespace);

    const _trustedSources = devWorkspacePreferences[TRUSTED_SOURCES_KEY] as api.TrustedSources;

    let data: api.IWorkspacePreferences;
    if (trustedSource === '*') {
      data = Object.assign({}, devWorkspacePreferences, {
        [TRUSTED_SOURCES_KEY]: trustedSource,
      });
    } else {
      const trustedSources = Array.isArray(_trustedSources) ? _trustedSources : [];
      trustedSources.push(trustedSource);
      data = Object.assign({}, devWorkspacePreferences, {
        [TRUSTED_SOURCES_KEY]: trustedSources,
      });
    }

    await this.updateWorkspacePreferences(namespace, data);
  }

  public async removeTrustedSources(namespace: string): Promise<void> {
    const devWorkspacePreferences = await this.getWorkspacePreferences(namespace);

    const data = Object.assign({}, devWorkspacePreferences);
    delete data[TRUSTED_SOURCES_KEY];

    await this.updateWorkspacePreferences(namespace, data);
  }
}
