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

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export function registerDexCallback(server: FastifyInstance) {
  server.get('/oauth/callback', async function (request: FastifyRequest, reply: FastifyReply) {
    const { token } = await server.localStart.getAccessTokenFromAuthorizationCodeFlow(request);
    process.env.CLUSTER_ACCESS_TOKEN = token.access_token;
    const authorizationUri = server.localStart.generateAuthorizationUri(request, reply);
    return reply.redirect(token ? '/dashboard/' : authorizationUri);
  });
}
