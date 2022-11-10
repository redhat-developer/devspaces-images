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

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastifyHttpProxy from '@fastify/http-proxy';
import oauthPlugin, { OAuth2Namespace } from '@fastify/oauth2';

declare module 'fastify' {
  interface FastifyInstance {
    localStart: OAuth2Namespace;
  }
}

const CHE_HOST = process.env.CHE_HOST as string;
const CLIENT_ID = process.env.CLIENT_ID as string;
const CLIENT_SECRET = process.env.CLIENT_SECRET as string;

export function registerOauth(server: FastifyInstance) {
  server.register(oauthPlugin, {
    name: 'localStart',
    credentials: {
      client: {
        id: CLIENT_ID,
        secret: CLIENT_SECRET,
      },
      auth: {
        authorizeHost: CHE_HOST,
        authorizePath: '/auth/local',
        tokenHost: CHE_HOST,
        tokenPath: 'token',
      },
    },
    scope: ['openid', 'email', 'profile'],
    startRedirectPath: '/oauth/sign_in',
    callbackUri: `${CHE_HOST}/oauth/callback`,
  });

  server.get('/oauth/sign_out', async function (request: FastifyRequest, reply: FastifyReply) {
    process.env.CLUSTER_ACCESS_TOKEN = '';
    const url = server.localStart.generateAuthorizationUri(request);
    return reply.redirect(url);
  });
}

export function registerDexCallback(server: FastifyInstance) {
  server.get('/oauth/callback', async function (request: FastifyRequest, reply: FastifyReply) {
    const token = await server.localStart.getAccessTokenFromAuthorizationCodeFlow(request);
    process.env.CLUSTER_ACCESS_TOKEN = token?.access_token;
    const authorizationUri = server.localStart.generateAuthorizationUri(request);
    return reply.redirect(token ? '/dashboard/' : authorizationUri);
  });
}

export function addDexProxy(server: FastifyInstance, dexIngress: string) {
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

export function addAuthorizationHooks(server: FastifyInstance) {
  server.addHook('onResponse', (request, reply, done) => {
    if (
      (request.url.startsWith('/api/') || request.url.startsWith('/dashboard/api/')) &&
      request.method === 'GET' &&
      reply.statusCode === 401
    ) {
      process.env.CLUSTER_ACCESS_TOKEN = '';
    }
    done();
  });

  server.addHook('preHandler', (request, reply, done) => {
    if (
      !process.env.CLUSTER_ACCESS_TOKEN &&
      request.url === '/dashboard/' &&
      request.method === 'GET'
    ) {
      const url = server.localStart.generateAuthorizationUri(request);
      reply.redirect(url);
    }
    done();
  });
}
