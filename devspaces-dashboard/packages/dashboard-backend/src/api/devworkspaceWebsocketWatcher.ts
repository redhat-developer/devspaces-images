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

import { FastifyInstance, FastifyRequest } from 'fastify';
import { SocketStream } from '@fastify/websocket';
import { baseApiPath } from '../constants/config';
import SubscribeManager, { Channel, Parameters } from '../services/SubscriptionManager';
import { getToken } from './helper';

type Action = 'SUBSCRIBE' | 'UNSUBSCRIBE';

async function handler(connection: SocketStream, request: FastifyRequest) {
  const bearerAuthenticationToken = request?.headers?.authorization ? getToken(request) : undefined;

  const socket = connection.socket;
  const pubSubManager = new SubscribeManager(socket);

  socket.on('message', messageStr => {
    let message: { request: Action; params: Parameters; channel: Channel };
    try {
      message = JSON.parse(messageStr.toString());
    } catch (e) {
      console.warn(`[WARN] Can't parse the WS message payload:`, messageStr.toString());
      throw e;
    }
    const { request, params, channel } = message;

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
        pubSubManager.subscribe(channel, params);
        break;
    }
  });
}

export function registerDevworkspaceWebsocketWatcher(server: FastifyInstance) {
  server.get(`${baseApiPath}/websocket`, { websocket: true }, handler);
}
