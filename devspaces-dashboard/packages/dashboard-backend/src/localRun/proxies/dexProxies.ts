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

import fastifyHttpProxy from '@fastify/http-proxy';
import { FastifyInstance } from 'fastify';

export function registerDexProxies(server: FastifyInstance, dexIngress: string) {
  server.register(fastifyHttpProxy, {
    upstream: dexIngress,
    prefix: '/approval',
    rewritePrefix: '/approval',
    disableCache: true,
  });

  server.register(fastifyHttpProxy, {
    upstream: dexIngress,
    prefix: '/theme',
    rewritePrefix: '/theme',
    disableCache: true,
  });

  server.register(fastifyHttpProxy, {
    upstream: dexIngress,
    prefix: '/static',
    rewritePrefix: '/static',
    disableCache: true,
  });

  server.register(fastifyHttpProxy, {
    upstream: dexIngress,
    prefix: '/token',
    rewritePrefix: '/token',
    disableCache: true,
  });

  server.register(fastifyHttpProxy, {
    upstream: dexIngress,
    prefix: '/auth',
    rewritePrefix: '/auth',
    disableCache: true,
  });
}
