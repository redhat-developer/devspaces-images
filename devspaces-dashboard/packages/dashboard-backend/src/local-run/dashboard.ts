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

export function authenticateDashboardRequestsHook(server: FastifyInstance) {
  // authenticate requests to Dashboard Backend
  server.addHook('onRequest', (request, reply, done) => {
    if (request.url.startsWith('/dashboard/api')) {
      const clusterAccessToken = process.env.CLUSTER_ACCESS_TOKEN as string;
      if (clusterAccessToken) {
        request.headers.authorization = 'Bearer ' + clusterAccessToken;
      }
    }
    done();
  });
}
