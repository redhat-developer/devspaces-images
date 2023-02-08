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

import { api } from '@eclipse-che/common';
import { SocketStream } from '@fastify/websocket';
import { FastifyInstance, FastifyRequest } from 'fastify';
import WebSocket from 'ws';
import { baseApiPath } from '../../constants/config';
import { ObjectsWatcher } from '../../services/ObjectsWatcher';
import { SubscriptionManager } from '../../services/SubscriptionManager';
import { getDevWorkspaceClient } from './helpers/getDevWorkspaceClient';
import { getToken } from './helpers/getToken';

export function registerWebsocket(server: FastifyInstance) {
  server.get(`${baseApiPath}/websocket`, { websocket: true }, webSocketHandler);
}

function webSocketHandler(connection: SocketStream, request: FastifyRequest): void {
  const ws = connection.socket;

  const token = getToken(request);
  const { eventApi, devworkspaceApi, podApi } = getDevWorkspaceClient(token);

  const subscriptionManager = new SubscriptionManager(ws);

  const eventWatcher = new ObjectsWatcher(eventApi, api.webSocket.Channel.EVENT);
  const devWorkspaceWatcher = new ObjectsWatcher(
    devworkspaceApi,
    api.webSocket.Channel.DEV_WORKSPACE,
  );
  const podWatcher = new ObjectsWatcher(podApi, api.webSocket.Channel.POD);

  async function handleChannelSubscribe(
    channel: api.webSocket.Channel,
    params: api.webSocket.SubscribeParams,
  ): Promise<void> {
    subscriptionManager.subscribe(channel);

    switch (channel) {
      case api.webSocket.Channel.DEV_WORKSPACE: {
        devWorkspaceWatcher.attach(subscriptionManager);
        await devWorkspaceWatcher.start(params.namespace, params.resourceVersion);
        break;
      }
      case api.webSocket.Channel.EVENT: {
        eventWatcher.attach(subscriptionManager);
        await eventWatcher.start(params.namespace, params.resourceVersion);
        break;
      }
      case api.webSocket.Channel.POD: {
        podWatcher.attach(subscriptionManager);
        await podWatcher.start(params.namespace, params.resourceVersion);
        break;
      }
    }
  }
  function handleChannelUnsubscribe(channel: api.webSocket.Channel) {
    subscriptionManager.unsubscribe(channel);

    switch (channel) {
      case api.webSocket.Channel.DEV_WORKSPACE: {
        devWorkspaceWatcher.detach();
        devWorkspaceWatcher.stop();
        break;
      }
      case api.webSocket.Channel.EVENT: {
        eventWatcher.detach();
        eventWatcher.stop();
        break;
      }
      case api.webSocket.Channel.POD: {
        podWatcher.detach();
        podWatcher.stop();
        break;
      }
    }
  }
  function handleUnsubscribeAll() {
    [api.webSocket.Channel.DEV_WORKSPACE, api.webSocket.Channel.EVENT].forEach(channel =>
      handleChannelUnsubscribe(channel),
    );
  }

  ws.on('close', (code: number, reason: string) => {
    console.warn(`[WARN] The WebSocket connection closed. Code: ${code}, reason: ${reason}`);
    handleUnsubscribeAll();
  });
  ws.on('error', (error: Error) => {
    console.error(`[ERROR] The WebSocket connection error:`, error);
    handleUnsubscribeAll();
  });
  ws.on('message', async (messageStr: WebSocket.Data) => {
    let message: api.webSocket.SubscribeMessage | api.webSocket.UnsubscribeMessage;
    try {
      const obj = JSON.parse(messageStr.toString());
      if (api.webSocket.isWebSocketSubscriptionMessage(obj)) {
        message = obj;
      } else {
        console.warn(`[WARN] Unexpected WS message payload:`, messageStr.toString());
        return;
      }
    } catch (e) {
      console.warn(`[WARN] Can't parse the WS message payload:`, messageStr.toString());
      throw e;
    }

    switch (message.method) {
      case 'UNSUBSCRIBE': {
        handleChannelUnsubscribe(message.channel);
        break;
      }
      case 'SUBSCRIBE': {
        await handleChannelSubscribe(message.channel, message.params);
        break;
      }
    }
  });
}
