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

export function registerSignOut(server: FastifyInstance) {
  server.get('/oauth/sign_out', async function (request: FastifyRequest, reply: FastifyReply) {
    process.env.CLUSTER_ACCESS_TOKEN = '';
    const url = server.localStart.generateAuthorizationUri(request);
    return reply.redirect(url);
  });
}
