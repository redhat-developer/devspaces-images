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

import fastifyStatic from '@fastify/static';
import { DoneFuncWithErrOrRes, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import path from 'path';

import { logger } from '@/utils/logger';

export function registerStaticServer(publicFolder: string, server: FastifyInstance) {
  const rootPath = path.resolve(__dirname, publicFolder);
  logger.info(`Static server's serving "${rootPath}" on 0.0.0.0:8080/`);

  server.register(fastifyStatic, {
    root: rootPath,
    maxAge: 24 * 60 * 60 * 1000,
    lastModified: true,
    prefix: '/',
  });

  const doNotCache = [
    '/dashboard/',
    '/dashboard/index.html',
    '/dashboard/service-worker.js',
    '/dashboard/assets/branding/product.json',
  ];
  server.addHook(
    'onSend',
    (request: FastifyRequest, reply: FastifyReply, payload: any, done: DoneFuncWithErrOrRes) => {
      const err = null;
      if (doNotCache.includes(request.url)) {
        reply.header('cache-control', 'no-store, max-age=0');
      }
      done(err, payload);
    },
  );
}
