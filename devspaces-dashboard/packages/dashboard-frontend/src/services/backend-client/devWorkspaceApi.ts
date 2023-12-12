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

import { api, helpers } from '@eclipse-che/common';
import axios from 'axios';
import { JSONSchema7 } from 'json-schema';

import { AxiosWrapper } from '@/services/axios-wrapper/axiosWrapper';
import { dashboardBackendPrefix } from '@/services/backend-client/const';
import devfileApi, { IDevWorkspacesList } from '@/services/devfileApi';

export type Headers = { [key: string]: string };

export async function createWorkspace(
  devworkspace: devfileApi.DevWorkspace,
): Promise<{ devWorkspace: devfileApi.DevWorkspace; headers: Headers }> {
  try {
    const response = await AxiosWrapper.createToRetryMissedBearerTokenError().post(
      `${dashboardBackendPrefix}/namespace/${devworkspace.metadata.namespace}/devworkspaces`,
      { devworkspace },
    );
    return { devWorkspace: response.data, headers: response.headers };
  } catch (e) {
    const errorMessage = helpers.errors.getMessage(e);
    if (errorMessage.startsWith('Unable to create devworkspace')) {
      throw new Error(errorMessage);
    }
    throw new Error(`Failed to create a new workspace. ${errorMessage}`);
  }
}

export async function listWorkspacesInNamespace(
  defaultNamespace: string,
): Promise<IDevWorkspacesList> {
  try {
    const response = await AxiosWrapper.createToRetryMissedBearerTokenError().get(
      `${dashboardBackendPrefix}/namespace/${defaultNamespace}/devworkspaces`,
    );
    return response.data;
  } catch (e) {
    throw new Error(`Failed to fetch the list of devWorkspaces. ${helpers.errors.getMessage(e)}`);
  }
}

export async function getWorkspaceByName(
  namespace: string,
  workspaceName: string,
): Promise<devfileApi.DevWorkspace> {
  try {
    const response = await AxiosWrapper.createToRetryMissedBearerTokenError().get(
      `${dashboardBackendPrefix}/namespace/${namespace}/devworkspaces/${workspaceName}`,
    );
    return response.data;
  } catch (e) {
    throw new Error(
      `Failed to fetch workspace '${workspaceName}'. ${helpers.errors.getMessage(e)}`,
    );
  }
}

export async function patchWorkspace(
  namespace: string,
  workspaceName: string,
  patch: api.IPatch[],
): Promise<{ devWorkspace: devfileApi.DevWorkspace; headers: Headers }> {
  try {
    const response = await AxiosWrapper.createToRetryMissedBearerTokenError().patch(
      `${dashboardBackendPrefix}/namespace/${namespace}/devworkspaces/${workspaceName}`,
      patch,
    );
    return { devWorkspace: response.data, headers: response.headers };
  } catch (e) {
    throw new Error(
      `Failed to update workspace '${workspaceName}'. ${helpers.errors.getMessage(e)}`,
    );
  }
}

export async function deleteWorkspace(namespace: string, workspaceName: string): Promise<void> {
  try {
    await AxiosWrapper.createToRetryMissedBearerTokenError().delete(
      `${dashboardBackendPrefix}/namespace/${namespace}/devworkspaces/${workspaceName}`,
    );
  } catch (e) {
    throw new Error(
      `Failed to delete workspace '${workspaceName}'. ${helpers.errors.getMessage(e)}`,
    );
  }
}

export async function getDockerConfig(namespace: string): Promise<api.IDockerConfig> {
  try {
    const response = await AxiosWrapper.createToRetryMissedBearerTokenError().get(
      `${dashboardBackendPrefix}/namespace/${namespace}/dockerconfig`,
    );
    return response.data;
  } catch (e) {
    throw new Error(`Failed to fetch dockerconfig. ${helpers.errors.getMessage(e)}`);
  }
}

export async function putDockerConfig(
  namespace: string,
  dockerconfig: api.IDockerConfig,
): Promise<api.IDockerConfig> {
  try {
    const response = await AxiosWrapper.createToRetryMissedBearerTokenError().put(
      `${dashboardBackendPrefix}/namespace/${namespace}/dockerconfig`,
      dockerconfig,
    );
    return response.data;
  } catch (e) {
    throw new Error(`Failed to put dockerconfig. ${helpers.errors.getMessage(e)}`);
  }
}

export async function injectKubeConfig(namespace: string, devworkspaceId: string): Promise<void> {
  try {
    await AxiosWrapper.createToRetryMissedBearerTokenError().post(
      `${dashboardBackendPrefix}/namespace/${namespace}/devworkspaceId/${devworkspaceId}/kubeconfig`,
    );
  } catch (e) {
    throw new Error(`Failed to inject kubeconfig. ${helpers.errors.getMessage(e)}`);
  }
}

export async function podmanLogin(namespace: string, devworkspaceId: string): Promise<void> {
  try {
    await AxiosWrapper.createToRetryMissedBearerTokenError().post(
      `${dashboardBackendPrefix}/namespace/${namespace}/devworkspaceId/${devworkspaceId}/podmanlogin`,
    );
  } catch (e) {
    throw new Error(`Failed to podman login. ${helpers.errors.getMessage(e)}`);
  }
}

export async function getDevfileSchema(
  schemaVersion: string,
): Promise<JSONSchema7 | { [key: string]: any }> {
  try {
    const response = await axios.get(`${dashboardBackendPrefix}/devfile?version=${schemaVersion}`);
    return response.data;
  } catch (e) {
    throw new Error(
      `Failed to get devfile schema '${schemaVersion}'. ${helpers.errors.getMessage(e)}`,
    );
  }
}
