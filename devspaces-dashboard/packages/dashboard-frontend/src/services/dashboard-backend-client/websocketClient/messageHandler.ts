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

import { api, helpers } from '@eclipse-che/common';

export type ChannelListener = (message: api.webSocket.NotificationMessage) => void;

/**
 * This class allows to manage listeners and notify them.
 */
export class WebSocketMessageHandler {
  private readonly listeners: Map<api.webSocket.Channel, ChannelListener[]> = new Map();

  /**
   * Adds a listener on an event for the given channel.
   */
  public addListener(channel: api.webSocket.Channel, listener: ChannelListener): void {
    const listeners = this.listeners.get(channel) || [];
    listeners.push(listener);
    this.listeners.set(channel, listeners);
  }

  /**
   * Removes a listener.
   */
  public removeListener(channel: api.webSocket.Channel, listener: ChannelListener): void {
    const listeners = this.listeners.get(channel) || [];
    listeners.splice(listeners.indexOf(listener), 1);
    this.listeners.set(channel, listeners);
  }

  /**
   * Notifies all listeners for the given channel.
   */
  public notifyListeners(event: MessageEvent<string>): void {
    try {
      const dataMessage = this.parseMessageEvent(event);
      const { channel, message } = dataMessage;
      const listeners = this.listeners.get(channel) || [];
      listeners.forEach(listener => listener(message));
    } catch (e) {
      console.warn(helpers.errors.getMessage(e), event.data);
    }
  }

  private parseMessageEvent(event: MessageEvent<string>): api.webSocket.EventData {
    let dataMessage: api.webSocket.EventData;
    try {
      dataMessage = JSON.parse(event.data);
    } catch (e) {
      throw new Error(`[WARN] Can't parse the WS message payload:`);
    }

    if (api.webSocket.isWebSocketEventData(dataMessage)) {
      return dataMessage;
    } else {
      throw new Error(`[WARN] Unexpected WS message payload:`);
    }
  }
}
