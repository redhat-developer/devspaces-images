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

export function registerFactoryAcceptanceRedirect(server: FastifyInstance): void {
  // redirect to the Dashboard factory flow
  function redirectFactoryFlow(path: string) {
    server.get(path, async (request: FastifyRequest, reply: FastifyReply) => {
      const queryStr = request.url.replace(path, '');
      return reply.redirect('/dashboard/#/load-factory' + queryStr);
    });
  }
  redirectFactoryFlow('/f');
  redirectFactoryFlow('/dashboard/f');
}
