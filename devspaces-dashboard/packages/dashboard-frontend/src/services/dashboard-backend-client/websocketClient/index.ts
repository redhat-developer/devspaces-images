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
import { injectable } from 'inversify';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { getDefer, IDeferred } from '../../helpers/deferred';
import { prefix } from '../const';
import { ChannelListener, WebSocketMessageHandler } from './messageHandler';
import { SubscriptionArgs, WebSocketSubscriptionsManager } from './subscriptionsManager';

export enum ConnectionEvent {
  OPEN = 'open',
  CLOSE = 'close',
  ERROR = 'error',
}
export type ConnectionListener = (...args: unknown[]) => void;

@injectable()
export class WebsocketClient {
  private connectDeferred: IDeferred<void> | undefined;
  private lastFiredConnectionEvent: [ConnectionEvent, unknown[]] | undefined; // tuple of event type and arguments
  private readonly connectionEventListeners: Map<ConnectionEvent, ConnectionListener[]> = new Map();
  private readonly messageHandler: WebSocketMessageHandler;
  private readonly subscriptionsManager: WebSocketSubscriptionsManager;
  private websocketStream: ReconnectingWebSocket | undefined;
  public readonly websocketContext = `${prefix}/websocket`;

  constructor() {
    this.messageHandler = new WebSocketMessageHandler();
    this.subscriptionsManager = new WebSocketSubscriptionsManager();
  }

  /**
   * If `existingEventNotification` equals ‘true’ then listener will be immediately notified about last fired event in case if their types match.
   */
  public addConnectionEventListener(
    type: ConnectionEvent,
    listener: ConnectionListener,
    existingEventNotification = false,
  ): void {
    const listeners = this.connectionEventListeners.get(type) || [];
    this.connectionEventListeners.set(type, [...listeners, listener]);

    if (existingEventNotification === false || this.lastFiredConnectionEvent === undefined) {
      return;
    }

    const [eventType, args] = this.lastFiredConnectionEvent;
    if (type === eventType) {
      listener(...args);
    }
  }

  public removeConnectionEventListener(type: ConnectionEvent, listener: ConnectionListener): void {
    const listeners = this.connectionEventListeners.get(type) || [];
    this.connectionEventListeners.set(
      type,
      listeners.filter(_listener => _listener !== listener),
    );
  }

  private notifyConnectionEventListeners(eventType: ConnectionEvent, ...args: unknown[]): void {
    console.log(
      `WebSocket client '${this.websocketContext}' received '${eventType}' event`,
      ...args,
    );

    const listeners = this.connectionEventListeners.get(eventType) || [];
    this.lastFiredConnectionEvent = [eventType, args];
    listeners.forEach(listener => listener(...args));
  }

  /**
   * Performs connection to the pointed entrypoint.
   */
  public async connect(): Promise<void> {
    if (this.connectDeferred) {
      return this.connectDeferred.promise;
    }

    const deferred = getDefer<void>();

    const origin = new URL(window.location.href).origin;
    const location = origin.replace('http', 'ws') + this.websocketContext;
    this.websocketStream = new ReconnectingWebSocket(location, [], {
      connectionTimeout: 5000,
      maxReconnectionDelay: 5000,
      minReconnectionDelay: 500,
    });

    this.websocketStream.addEventListener('open', () => {
      this.notifyConnectionEventListeners(ConnectionEvent.OPEN);
      this.reSubscribeToChannels();
      deferred.resolve();
    });
    this.websocketStream.addEventListener('close', event => {
      this.notifyConnectionEventListeners(ConnectionEvent.CLOSE, event);
    });
    this.websocketStream.addEventListener('error', event => {
      this.notifyConnectionEventListeners(ConnectionEvent.ERROR, event);
      deferred.reject();
    });
    this.websocketStream.addEventListener('message', event => {
      this.messageHandler.notifyListeners(event);
    });

    this.connectDeferred = deferred;
    return this.connectDeferred.promise;
  }

  /**
   * When connection is re-established, resubscribe to all channels.
   */
  private reSubscribeToChannels(): void {
    const subscribeMessages = this.subscriptionsManager.getSubscriptions();

    if (this.websocketStream === undefined) {
      return;
    }

    if (this.websocketStream.readyState !== this.websocketStream.OPEN) {
      return;
    }

    for (const message of subscribeMessages) {
      this.websocketStream.send(JSON.stringify(message));
    }
  }

  /**
   * Send a message that subscribes to events for the given channel.
   */
  public subscribeToChannel(...args: SubscriptionArgs): void {
    const subscribeMessage = this.subscriptionsManager.addSubscription(...args);

    if (this.websocketStream === undefined) {
      return;
    }

    if (this.websocketStream.readyState !== this.websocketStream.OPEN) {
      return;
    }

    this.websocketStream.send(JSON.stringify(subscribeMessage));
  }

  /**
   * Send a message that unsubscribes from events for the given channel.
   */
  public unsubscribeFromChannel(channel: api.webSocket.Channel): void {
    const unsubscribeMessage = this.subscriptionsManager.removeSubscription(channel);

    if (this.websocketStream === undefined) {
      return;
    }

    if (this.websocketStream.readyState !== this.websocketStream.OPEN) {
      return;
    }

    this.websocketStream.send(JSON.stringify(unsubscribeMessage));
  }

  /**
   * Adds a data message listener for the given channel.
   */
  public addChannelMessageListener(
    channel: api.webSocket.Channel,
    listener: ChannelListener,
  ): void {
    this.messageHandler.addListener(channel, listener);
  }

  /**
   * Returns true if the given channel has a listener.
   */
  public hasChannelMessageListener(channel: api.webSocket.Channel): boolean {
    return this.messageHandler.hasListener(channel);
  }
}
