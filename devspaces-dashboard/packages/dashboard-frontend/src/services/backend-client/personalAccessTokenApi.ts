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

export async function fetchTokens(namespace: string): Promise<api.PersonalAccessToken[]> {
  try {
    const response = await AxiosWrapper.createToRetryMissedBearerTokenError().get(
      `${dashboardBackendPrefix}/namespace/${namespace}/personal-access-token`,
    );
    return response.data;
  } catch (e) {
    throw new Error(`Failed to fetch personal access tokens. ${helpers.errors.getMessage(e)}`);
  }
}

export async function addToken(
  namespace: string,
  token: api.PersonalAccessToken,
): Promise<api.PersonalAccessToken> {
  try {
    const response = await AxiosWrapper.createToRetryMissedBearerTokenError().post(
      `${dashboardBackendPrefix}/namespace/${namespace}/personal-access-token`,
      token,
    );
    return response.data;
  } catch (e) {
    throw new Error(`Failed to add the personal access token. ${helpers.errors.getMessage(e)}`);
  }
}

export async function updateToken(
  namespace: string,
  token: api.PersonalAccessToken,
): Promise<api.PersonalAccessToken> {
  try {
    const response = await AxiosWrapper.createToRetryMissedBearerTokenError().patch(
      `${dashboardBackendPrefix}/namespace/${namespace}/personal-access-token`,
      token,
    );
    return response.data;
  } catch (e) {
    throw new Error(`Failed to update the personal access token. ${helpers.errors.getMessage(e)}`);
  }
}

export async function removeToken(
  namespace: string,
  token: api.PersonalAccessToken,
): Promise<api.PersonalAccessToken> {
  try {
    const response = await AxiosWrapper.createToRetryMissedBearerTokenError().delete(
      `${dashboardBackendPrefix}/namespace/${namespace}/personal-access-token/${token.tokenName}`,
    );
    return response.data;
  } catch (e) {
    throw new Error(`Failed to remove the personal access token. ${helpers.errors.getMessage(e)}`);
  }
}
