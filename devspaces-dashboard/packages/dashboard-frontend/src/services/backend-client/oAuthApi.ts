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
import axios from 'axios';

import { AxiosWrapper } from '@/services/axios-wrapper/axiosWrapper';
import { cheServerPrefix, dashboardBackendPrefix } from '@/services/backend-client/const';
import { IGitOauth } from '@/store/GitOauthConfig/types';

export async function getOAuthProviders(): Promise<IGitOauth[]> {
  const response = await axios.get(`${cheServerPrefix}/oauth`);

  return response.data;
}

export async function getOAuthToken(provider: api.GitOauthProvider): Promise<{ token: string }> {
  const response = await axios.get(`${cheServerPrefix}/oauth/token?oauth_provider=${provider}`);

  return response.data;
}

export async function deleteOAuthToken(provider: api.GitOauthProvider): Promise<void> {
  await axios.delete(`${cheServerPrefix}/oauth/token?oauth_provider=${provider}`);
}

export async function getDevWorkspacePreferences(
  namespace: string,
): Promise<api.IDevWorkspacePreferences> {
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
