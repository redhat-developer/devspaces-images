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

import { AxiosWrapper } from '@/services/axios-wrapper/axiosWrapper';
import { dashboardBackendPrefix } from '@/services/backend-client/const';

export async function fetchSshKeys(namespace: string): Promise<api.SshKey[]> {
  try {
    const response = await AxiosWrapper.createToRetryMissedBearerTokenError().get(
      `${dashboardBackendPrefix}/namespace/${namespace}/ssh-key`,
    );
    return response.data;
  } catch (e) {
    throw new Error(`Failed to fetch SSH keys. ${helpers.errors.getMessage(e)}`);
  }
}

export async function addSshKey(namespace: string, sshKey: api.NewSshKey): Promise<api.SshKey> {
  try {
    const response = await AxiosWrapper.createToRetryMissedBearerTokenError().post(
      `${dashboardBackendPrefix}/namespace/${namespace}/ssh-key`,
      sshKey,
    );
    return response.data;
  } catch (e) {
    throw new Error(`Failed to add the SSH key. ${helpers.errors.getMessage(e)}`);
  }
}

export async function removeSshKey(namespace: string, key: api.SshKey): Promise<void> {
  try {
    await AxiosWrapper.createToRetryMissedBearerTokenError().delete(
      `${dashboardBackendPrefix}/namespace/${namespace}/ssh-key/${key.name}`,
    );
  } catch (e) {
    throw new Error(`Failed to remove the SSH key. ${helpers.errors.getMessage(e)}`);
  }
}
