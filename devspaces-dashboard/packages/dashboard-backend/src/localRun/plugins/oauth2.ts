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

import { FastifyInstance } from 'fastify';
import oauth2Plugin, { OAuth2Namespace } from '@fastify/oauth2';

declare module 'fastify' {
  interface FastifyInstance {
    localStart: OAuth2Namespace;
  }
}

const CHE_HOST = process.env.CHE_HOST as string;
const CLIENT_ID = process.env.CLIENT_ID as string;
const CLIENT_SECRET = process.env.CLIENT_SECRET as string;

export function registerOauth2Plugin(server: FastifyInstance) {
  server.register(oauth2Plugin, {
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
}
