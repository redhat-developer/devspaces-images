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

import fastifyCors from '@fastify/cors';
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';

export function registerCors(isLocalRun: boolean, server: FastifyInstance) {
  server.register(
    fastifyCors,
    () =>
      (
        req: FastifyRequest,
        callback: (error: Error | null, options: FastifyPluginOptions) => unknown,
      ) => {
        // disable cors checks on when running locally
        const corsOptions = isLocalRun
          ? {
              origin: false,
            }
          : {
              origin: [process.env.CHE_HOST],
              methods: ['GET', 'POST', 'PATCH', 'DELETE'],
            };
        callback(null, corsOptions);
      },
  );
}
