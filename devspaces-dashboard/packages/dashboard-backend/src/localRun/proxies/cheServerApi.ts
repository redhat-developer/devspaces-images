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
import { stubCheServerOptionsRequests } from '../hooks/stubCheServerOptionsRequests';

// to workaround the issue with TextEncoder
import { TextEncoder } from 'util';
(global as any).TextEncoder = TextEncoder;
import fastifyHttpProxy from '@fastify/http-proxy';

export function registerCheApiProxy(server: FastifyInstance, upstream: string, origin: string) {
  console.log(`Dashboard proxies requests to Che Server API on ${upstream}/api.`);
  // server api
  server.register(fastifyHttpProxy, {
    upstream,
    prefix: '/api/',
    rewritePrefix: '/api/',
    disableCache: true,
    websocket: false,
    replyOptions: {
      rewriteRequestHeaders: (originalReq, headers) => {
        const clusterAccessToken = process.env.CLUSTER_ACCESS_TOKEN as string;
        if (clusterAccessToken) {
          headers.authorization = 'Bearer ' + clusterAccessToken;
        }
        return Object.assign({ ...headers }, { origin });
      },
    },
  });
  stubCheServerOptionsRequests(server);
}
