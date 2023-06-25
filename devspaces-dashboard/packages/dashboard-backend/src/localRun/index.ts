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

import { FastifyInstance } from 'fastify';
import { authenticateApiRequestsHook } from './hooks/authenticateApiRequests';
import { addAuthorizationHooks } from './hooks/authorizationHooks';
import { registerOauth2Plugin } from './plugins/oauth2';
import { registerCheApiProxy } from './proxies/cheServerApi';
import { registerDexProxies } from './proxies/dexProxies';
import { registerDexCallback } from './routes/dexCallback';
import { registerSignOut } from './routes/signOut';

export function isLocalRun(): boolean {
  const isLocalRun = process.env['LOCAL_RUN'] === 'true';
  return isLocalRun;
}

export function registerLocalRun(server: FastifyInstance) {
  console.log('Running locally, setting up stubs');

  const isNativeAuth = process.env['NATIVE_AUTH'] === 'true';
  const cheApiProxyUpstream = process.env['CHE_API_PROXY_UPSTREAM'] || '';
  const dexIngress = process.env.DEX_INGRESS || '';
  const cheHostOrigin = process.env.CHE_HOST_ORIGIN || '';
  const cheInternalUrl = process.env.CHE_INTERNAL_URL || '';

  let upstream: string;
  if (cheInternalUrl) {
    upstream = new URL(cheInternalUrl).origin;
  } else {
    upstream = cheApiProxyUpstream ? cheApiProxyUpstream : cheHostOrigin;
  }

  if (dexIngress) {
    registerDexProxies(server, `https://${dexIngress}`);
    registerDexCallback(server);
    registerOauth2Plugin(server);
    registerSignOut(server);
    addAuthorizationHooks(server);
  }

  if (isNativeAuth) {
    authenticateApiRequestsHook(server);
  }
  registerCheApiProxy(server, upstream, cheHostOrigin);
}
