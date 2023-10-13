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
import WebSocket from 'ws';

import { NotificationMessage, Observer } from '@/services/types/Observer';

/**
 * This class implements the Observer pattern. It reacts to the changes in the subject and sends messages to subscribers over WebSocket.
 */
export class SubscriptionManager implements Observer {
  private readonly websocket: WebSocket;
  private channels: api.webSocket.Channel[] = [];

  constructor(websocket: WebSocket) {
    this.websocket = websocket;
  }

  update(channel: api.webSocket.Channel, message: NotificationMessage): void {
    this.sendMessage({ channel, message });
  }

  sendMessage(dataMessage: api.webSocket.EventData): void {
    if (this.channels.includes(dataMessage.channel)) {
      this.websocket.send(JSON.stringify(dataMessage));
    }
  }

  subscribe(channel: api.webSocket.Channel): void {
    this.unsubscribe(channel);
    this.channels.push(channel);
  }

  unsubscribe(channel: api.webSocket.Channel): void {
    this.channels = this.channels.filter(item => item !== channel);
  }

  unsubscribeAll(): void {
    this.channels = [];
  }
}
