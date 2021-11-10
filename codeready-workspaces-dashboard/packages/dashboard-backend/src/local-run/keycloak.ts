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

import { FastifyInstance } from 'fastify';
import fastifyHttpProxy from 'fastify-http-proxy';

export function registerKeycloakProxy(
  server: FastifyInstance,
  cheApiProxyUpstream: string,
  origin: string,
) {
  console.log(`Dashboard proxies requests to Keycloak on "${cheApiProxyUpstream}/auth".`);
  server.register(fastifyHttpProxy, {
    upstream: cheApiProxyUpstream,
    prefix: '/auth',
    rewritePrefix: '/auth',
    disableCache: true,
    websocket: false,
    replyOptions: {
      rewriteRequestHeaders: (originalReq, headers) => {
        return Object.assign({ ...headers }, { origin });
      },
    },
  });
}
