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

import fastifyCors from 'fastify-cors';
import { FastifyInstance } from 'fastify';

export function registerCors(isLocalRun: boolean, server: FastifyInstance) {
  // todo replace an 'any' with the target type
  server.register(fastifyCors, () => (req: any, callback: any) => {
    // disable cors checks on when running locally
    const corsOptions = isLocalRun ? {
      origin: false
    } : {
        origin: [process.env.CHE_HOST],
        methods: ['GET', 'POST', 'PATCH', 'DELETE']
      };
    callback(null, corsOptions);
  });
}
