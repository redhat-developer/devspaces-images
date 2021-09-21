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
import common from '@eclipse-che/common';
import devfileApi, { IDevWorkspacesList, IPatch } from '../devfileApi';
import { addAuthentication } from './auth';
import { prefix } from './const';

export async function createWorkspace(devworkspace: devfileApi.DevWorkspace): Promise<devfileApi.DevWorkspace> {
  const headers = addAuthentication({});
  try {
    const response = await axios.post(`${prefix}/namespace/${devworkspace.metadata.namespace}/devworkspaces`,
      { devworkspace },
      { headers });
    return response.data;
  } catch (e) {
    throw `Failed to create a new workspace. ${common.helpers.errors.getMessage(e)}`;
  }
}

export async function listWorkspacesInNamespace(defaultNamespace: string): Promise<IDevWorkspacesList> {
  const headers = addAuthentication({});
  try {
    const response = await axios.get(`${prefix}/namespace/${defaultNamespace}/devworkspaces`, { headers });
    return response.data;
  } catch (e) {
    throw `Failed to fetch the list of devWorkspaces. ${common.helpers.errors.getMessage(e)}`;
  }
}

export async function getWorkspaceByName(namespace: string, workspaceName: string): Promise<devfileApi.DevWorkspace> {
  const headers = addAuthentication({});
  try {
    const response = await axios.get(`${prefix}/namespace/${namespace}/devworkspaces/${workspaceName}`, { headers });
    return response.data;
  } catch (e) {
    throw `Failed to fetch workspace '${workspaceName}'. ${common.helpers.errors.getMessage(e)}`;
  }
}

export async function patchWorkspace(namespace: string, workspaceName: string, patch: IPatch[]): Promise<devfileApi.DevWorkspace> {
  const headers = addAuthentication({});
  try {
    const response = await axios.patch(`${prefix}/namespace/${namespace}/devworkspaces/${workspaceName}`, patch, { headers });
    return response.data;
  } catch (e) {
    throw `Failed to update workspace '${workspaceName}'. ${common.helpers.errors.getMessage(e)}`;
  }
}

export async function deleteWorkspace(namespace: string, workspaceName: string): Promise<devfileApi.DevWorkspace> {
  const headers = addAuthentication({});
  try {
    const response = await axios.delete(`${prefix}/namespace/${namespace}/devworkspaces/${workspaceName}`, { headers });
    return response.data;
  } catch (e) {
    throw `Failed to delete workspace '${workspaceName}'. ${common.helpers.errors.getMessage(e)}`;
  }
}
