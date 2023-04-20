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
  const subscriptionManager = new SubscriptionManager(ws);

  const token = getToken(request);
  const { eventApi, devworkspaceApi, logsApi, podApi } = getDevWorkspaceClient(token);

  const channel = api.webSocket.Channel;
  const watchers = {
    [channel.DEV_WORKSPACE]: new ObjectsWatcher(devworkspaceApi, channel.DEV_WORKSPACE),
    [channel.EVENT]: new ObjectsWatcher(eventApi, channel.EVENT),
    [channel.LOGS]: new ObjectsWatcher(logsApi, channel.LOGS),
    [channel.POD]: new ObjectsWatcher(podApi, channel.POD),
  };

  async function handleChannelSubscribe(message: api.webSocket.SubscribeMessage): Promise<void> {
    subscriptionManager.subscribe(message.channel);

    switch (message.channel) {
      case channel.DEV_WORKSPACE:
      case channel.EVENT:
      case channel.POD: {
        const watcher = watchers[message.channel];
        watcher.attach(subscriptionManager);
        await watcher.start(message.params.namespace, message.params);
        break;
      }
      case channel.LOGS: {
        const watcher = watchers[message.channel];
        watcher.attach(subscriptionManager);
        await watcher.start(message.params.namespace, message.params);
        break;
      }
    }
  }
  function handleChannelUnsubscribe(channel: api.webSocket.Channel) {
    subscriptionManager.unsubscribe(channel);

    const watcher = watchers[channel];
    watcher.detach();
    watcher.stop();
  }
  function handleUnsubscribeAll() {
    [channel.DEV_WORKSPACE, channel.EVENT, channel.LOGS, channel.POD].forEach(channel =>
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

    console.log(`[INFO] WS message:`, message);

    switch (message.method) {
      case 'UNSUBSCRIBE': {
        handleChannelUnsubscribe(message.channel);
        break;
      }
      case 'SUBSCRIBE': {
        await handleChannelSubscribe(message);
        break;
      }
    }
  });
}
