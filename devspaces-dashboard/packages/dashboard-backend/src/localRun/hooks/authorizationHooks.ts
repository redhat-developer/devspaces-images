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

export function addAuthorizationHooks(server: FastifyInstance) {
  server.addHook('onResponse', (request, reply, done) => {
    if (
      request.url.startsWith('/dashboard/api/') &&
      request.method === 'GET' &&
      reply.statusCode === 401
    ) {
      process.env.CLUSTER_ACCESS_TOKEN = '';
    }
    done();
  });

  server.addHook('preHandler', (request, reply, done) => {
    if (
      !process.env.CLUSTER_ACCESS_TOKEN &&
      request.url === '/dashboard/' &&
      request.method === 'GET'
    ) {
      const url = server.localStart.generateAuthorizationUri(request);
      reply.redirect(url);
    }
    done();
  });
}
