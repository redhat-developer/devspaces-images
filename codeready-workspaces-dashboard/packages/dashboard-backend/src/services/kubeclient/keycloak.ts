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

let keycloakEndpointUrl: URL | undefined;

const cheAxiosFactory = new CheAxiosFactory();

export async function validateToken(keycloakToken: string): Promise<void> {
  // lazy initialization
  if (!keycloakEndpointUrl) {
    keycloakEndpointUrl = await evaluateKeycloakEndpointUrl();
  }

  const headers = { Authorization: `Bearer ${keycloakToken}` };
  try {
    const axios = await cheAxiosFactory.getAxiosInstance(keycloakEndpointUrl.href);
    await axios.get(keycloakEndpointUrl.href, { headers });
    // token is a valid
  } catch (e) {
    throw createFastifyError(
      'FST_UNAUTHORIZED',
      `Failed to validate token: ${helpers.errors.getMessage(e)}`,
      401
    );
  }
}

async function evaluateKeycloakEndpointUrl(): Promise<URL> {
  try {
    const keycloakSettingsUrl = new URL('/api/keycloak/settings', CHE_HOST);
    console.log(`Evaluating keycloak user's endpoint with help of ${keycloakSettingsUrl}`);
    const axios = await cheAxiosFactory.getAxiosInstance(keycloakSettingsUrl.href);
    const response = await axios.get(keycloakSettingsUrl.href);
    let keycloakEndpoint = response.data[ENDPOINT];
    // we should change a HOST in the case of using proxy to prevent the host check error
    console.log(`Evaluated keycloak endpoint to validate user's tokens: ${keycloakEndpoint}`);
    if (isLocalRun) {
      const { pathname } = new URL(keycloakEndpoint);
      keycloakEndpoint = new URL(pathname, CHE_HOST);
      console.log(`Transforming keycloak URL for local run usage to: ${keycloakEndpoint}`);
      return keycloakEndpoint;
    } else {
      console.log(`Evaluated keycloak endpoint to validate user's tokens: ${keycloakEndpoint}`);
      return new URL(keycloakEndpoint);
    }
  } catch (e) {
    throw createFastifyError(
      'FST_UNAUTHORIZED',
      `Failed to fetch keycloak settings: ${helpers.errors.getMessage(e)}`,
      401
    );
  }
}
