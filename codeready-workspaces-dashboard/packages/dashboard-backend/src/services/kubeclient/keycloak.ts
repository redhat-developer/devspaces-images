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

import { helpers } from '@eclipse-che/common';
import { createFastifyError } from '../helpers';
import { URL } from 'url';
import { CheAxiosFactory } from '../che-http/CheAxiosFactory';
import { isLocalRun } from '../../local-run';

const CHE_HOST = process.env.CHE_INTERNAL_URL || process.env.CHE_HOST;
const ENDPOINT = 'che.keycloak.userinfo.endpoint';

const cheAxiosFactory = new CheAxiosFactory();

export async function validateToken(
  keycloakEndpoint: string,
  keycloakToken: string,
): Promise<void> {
  const headers = { Authorization: `Bearer ${keycloakToken}` };
  try {
    const axios = await cheAxiosFactory.getAxiosInstance(keycloakEndpoint);
    await axios.get(keycloakEndpoint, { headers });
    // token is a valid
  } catch (e) {
    throw createFastifyError(
      'FST_UNAUTHORIZED',
      `Failed to validate token: ${helpers.errors.getMessage(e)}`,
      401,
    );
  }
}

export async function evaluateKeycloakEndpointUrl(): Promise<string> {
  const keycloakSettingsUrl = new URL('/api/keycloak/settings', CHE_HOST);
  console.log(`Evaluating keycloak user's endpoint with help of ${keycloakSettingsUrl}`);
  const axios = await cheAxiosFactory.getAxiosInstance(keycloakSettingsUrl.href);
  const response = await axios.get(keycloakSettingsUrl.href);
  const keycloakEndpoint = new URL(response.data[ENDPOINT]);
  // we should change a HOST in the case of using proxy to prevent the host check error
  console.log(`Evaluated keycloak endpoint to validate user's tokens: ${keycloakEndpoint.href}`);

  if (isLocalRun) {
    const localRunKeycloakEndpoint = new URL(keycloakEndpoint.pathname, CHE_HOST);
    console.log(
      `Transforming keycloak URL for local run usage to: ${localRunKeycloakEndpoint.href}`,
    );
    return localRunKeycloakEndpoint.href;
  }

  return keycloakEndpoint.href;
}
