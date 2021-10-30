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

import axios from 'axios';
import { helpers, api } from '@eclipse-che/common';
import devfileApi, { IDevWorkspacesList } from '../devfileApi';
import { prefix } from './const';

export async function createWorkspace(devworkspace: devfileApi.DevWorkspace): Promise<devfileApi.DevWorkspace> {
  try {
    const response = await axios.post(`${prefix}/namespace/${devworkspace.metadata.namespace}/devworkspaces`,
      { devworkspace });
    return response.data;
  } catch (e) {
    throw `Failed to create a new workspace. ${helpers.errors.getMessage(e)}`;
  }
}

export async function listWorkspacesInNamespace(defaultNamespace: string): Promise<IDevWorkspacesList> {
  try {
    const response = await axios.get(`${prefix}/namespace/${defaultNamespace}/devworkspaces`);
    return response.data;
  } catch (e) {
    throw `Failed to fetch the list of devWorkspaces. ${helpers.errors.getMessage(e)}`;
  }
}

export async function getWorkspaceByName(namespace: string, workspaceName: string): Promise<devfileApi.DevWorkspace> {
  try {
    const response = await axios.get(`${prefix}/namespace/${namespace}/devworkspaces/${workspaceName}`);
    return response.data;
  } catch (e) {
    throw `Failed to fetch workspace '${workspaceName}'. ${helpers.errors.getMessage(e)}`;
  }
}

export async function patchWorkspace(namespace: string, workspaceName: string, patch: api.IPatch[]): Promise<devfileApi.DevWorkspace> {
  try {
    const response = await axios.patch(`${prefix}/namespace/${namespace}/devworkspaces/${workspaceName}`, patch);
    return response.data;
  } catch (e) {
    throw `Failed to update workspace '${workspaceName}'. ${helpers.errors.getMessage(e)}`;
  }
}

export async function deleteWorkspace(namespace: string, workspaceName: string): Promise<void> {
  try {
    await axios.delete(`${prefix}/namespace/${namespace}/devworkspaces/${workspaceName}`);
  } catch (e) {
    throw `Failed to delete workspace '${workspaceName}'. ${helpers.errors.getMessage(e)}`;
  }
}

export async function getDockerConfig(namespace: string): Promise<api.IDockerConfig> {
  try {
    const response = await axios.get(`${prefix}/namespace/${namespace}/dockerconfig`);
    return response.data;
  } catch (e) {
    throw `Failed to fetch dockerconfig. ${helpers.errors.getMessage(e)}`;
  }
}

export async function putDockerConfig(namespace: string, dockerconfig: api.IDockerConfig): Promise<api.IDockerConfig> {
  try {
    const response = await axios.put(`${prefix}/namespace/${namespace}/dockerconfig`, dockerconfig);
    return response.data;
  } catch (e) {
    throw `Failed to put dockerconfig. ${helpers.errors.getMessage(e)}`;
  }
}
