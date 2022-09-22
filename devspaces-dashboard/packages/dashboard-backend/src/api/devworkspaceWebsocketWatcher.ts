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

import { FastifyInstance, FastifyRequest, RouteShorthandOptions } from 'fastify';
import { SocketStream } from '@fastify/websocket';
import { baseApiPath } from '../constants/config';
import SubscribeManager from '../services/SubscriptionManager';
import { getToken } from './helper';

const options = { websocket: true } as RouteShorthandOptions;

async function handler(connection: SocketStream, request: FastifyRequest) {
  const bearerAuthenticationToken = request?.headers?.authorization ? getToken(request) : undefined;

  const socket = connection.socket;
  const pubSubManager = new SubscribeManager(socket);

  socket.on('message', message => {
    const { request, params, channel } = JSON.parse(message.toString());
    if (!request || !channel) {
      return;
    }
    if (params && bearerAuthenticationToken) {
      params.token = bearerAuthenticationToken;
    }
    switch (request) {
      case 'UNSUBSCRIBE':
        pubSubManager.unsubscribe(channel);
        break;
      case 'SUBSCRIBE':
        pubSubManager.subscribe(
          channel,
          params as { token: string; namespace: string; resourceVersion: string },
        );
        break;
    }
  });
}

export function registerDevworkspaceWebsocketWatcher(server: FastifyInstance) {
  server.get(`${baseApiPath}/websocket`, options, handler as any);
}
