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

import { AxiosWrapper } from '@/services/axios-wrapper/axiosWrapper';
import { dashboardBackendPrefix } from '@/services/backend-client/const';

export async function getWorkspacePreferences(
  namespace: string,
): Promise<api.IWorkspacePreferences> {
  const response = await AxiosWrapper.createToRetryMissedBearerTokenError().get(
    `${dashboardBackendPrefix}/workspace-preferences/namespace/${namespace}`,
  );

  return response.data;
}

export async function deleteSkipOauthProvider(
  namespace: string,
  provider: api.GitOauthProvider,
): Promise<void> {
  await AxiosWrapper.createToRetryMissedBearerTokenError().delete(
    `${dashboardBackendPrefix}/workspace-preferences/namespace/${namespace}/skip-authorisation/${provider}`,
  );
}

export async function addTrustedSource(
  namespace: string,
  trustedSource: api.TrustedSourceAll | api.TrustedSourceUrl,
): Promise<void> {
  await AxiosWrapper.createToRetryMissedBearerTokenError().post(
    `${dashboardBackendPrefix}/workspace-preferences/namespace/${namespace}/trusted-source`,
    { source: trustedSource },
  );
}

export async function removeTrustedSources(namespace: string): Promise<void> {
  await AxiosWrapper.createToRetryMissedBearerTokenError().delete(
    `${dashboardBackendPrefix}/workspace-preferences/namespace/${namespace}/trusted-source`,
  );
}
