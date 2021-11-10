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

import { FastifyInstance, FastifyRequest, RouteShorthandOptions } from 'fastify';
import fastifyHttpProxy from 'fastify-http-proxy';

export function registerCheApiProxy(
  server: FastifyInstance,
  cheApiProxyUpstream: string,
  origin: string,
  clusterAccessToken?: string,
) {
  console.log(`Dashboard proxies requests to Che Server API on ${cheApiProxyUpstream}/api.`);
  // server api
  server.register(fastifyHttpProxy, {
    upstream: cheApiProxyUpstream,
    prefix: '/api',
    rewritePrefix: '/api',
    disableCache: true,
    websocket: false,
    replyOptions: {
      rewriteRequestHeaders: (originalReq, headers) => {
        if (clusterAccessToken) {
          headers.authorization = 'Bearer ' + clusterAccessToken;
        }

        return Object.assign({ ...headers }, { origin });
      },
    },
  });
  // stub OPTIONS requests to '/api/' since they fails when running the backend locally.
  server.addHook('onRequest', (request, reply, done) => {
    if ((request.url === '/api' || request.url === '/api/') && request.method === 'OPTIONS') {
      return reply.send({
        implementationVersion: 'Local Run',
      });
    }
    done();
  });
  // fake JSON RPC for Che websocket API
  // because the real proxy fails to some reason
  // but since che workspace and devworkspace are not expected to work at the same time
  // faking is an easier solution
  server.get(
    '/api/websocket',
    { websocket: true } as RouteShorthandOptions,
    (connection: FastifyRequest) => {
      connection.socket.on('message', message => {
        const data = JSON.parse(message);
        if (data?.id && data?.jsonrpc) {
          (connection.socket as any).send(
            JSON.stringify({ jsonrpc: data.jsonrpc, id: data.id, result: [] }),
          );
        }
      });
    },
  );
}
