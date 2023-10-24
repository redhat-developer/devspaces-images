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

import { authenticateApiRequestsHook } from '@/localRun/hooks/authenticateApiRequests';
import { addAuthorizationHooks } from '@/localRun/hooks/authorizationHooks';
import { registerOauth2Plugin } from '@/localRun/plugins/oauth2';
import { registerCheApiProxy } from '@/localRun/proxies/cheServerApi';
import { registerDexProxies } from '@/localRun/proxies/dexProxies';
import { registerDexCallback } from '@/localRun/routes/dexCallback';
import { registerSignOut } from '@/localRun/routes/signOut';
import { logger } from '@/utils/logger';

export function isLocalRun(): boolean {
  const isLocalRun = process.env['LOCAL_RUN'] === 'true';
  return isLocalRun;
}

export function registerLocalRun(server: FastifyInstance) {
  logger.info('Running locally, setting up stubs');

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
