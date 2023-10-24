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

import fastifyHttpProxy from '@fastify/http-proxy';
import { FastifyInstance } from 'fastify';
import { TextEncoder } from 'util';

import { stubCheServerOptionsRequests } from '@/localRun/hooks/stubCheServerOptionsRequests';
import { logger } from '@/utils/logger';

// to workaround the issue with TextEncoder
(global as any).TextEncoder = TextEncoder;

export function registerCheApiProxy(server: FastifyInstance, upstream: string, origin: string) {
  logger.info(`Dashboard proxies requests to Che Server API on ${upstream}/api.`);
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
