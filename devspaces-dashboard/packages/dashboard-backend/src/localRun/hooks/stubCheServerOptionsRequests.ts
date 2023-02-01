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

export function stubCheServerOptionsRequests(server: FastifyInstance) {
  // stub OPTIONS requests to '/api/' since they fail when running the backend locally.
  server.addHook('onRequest', (request, reply, done) => {
    if ((request.url === '/api' || request.url === '/api/') && request.method === 'OPTIONS') {
      return reply.send({
        implementationVersion: 'Local Run',
      });
    }
    done();
  });
}
