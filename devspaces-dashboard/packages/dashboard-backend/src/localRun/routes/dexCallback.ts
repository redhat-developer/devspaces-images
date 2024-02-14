/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export function registerDexCallback(server: FastifyInstance) {
  server.get('/oauth/callback', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      const { token } = await server.localStart.getAccessTokenFromAuthorizationCodeFlow(request);
      process.env.CLUSTER_ACCESS_TOKEN = token.access_token;
      reply.redirect('/dashboard/');
    } catch (e) {
      // handle an error that usually occurs during the authorization flow from an abandoned tab with outdated state
      reply.redirect('/oauth/sign_in');
    }
  });
}
