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

import { prefix } from './const';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { getDefer } from '../helpers/deferred';
import { V1alpha2DevWorkspace } from '@devfile/api';

export type SubscribeMessage = {
  request: string;
  channel: string;
  params: { token?: string; namespace: string; resourceVersion?: string };
};

export type PublishMessage = {
  channel: string;
  message: string | V1alpha2DevWorkspace;
};

type Handler = (data: unknown) => void;

export class WebsocketClient {
  private websocketStream: ReconnectingWebSocket;
  private handlers: { [channel: string]: Handler[] } = {};
  private resourceVersion = 0;
  private readonly onDidWebSocketFailing: (websocketContext: string) => void;
  private readonly onDidWebSocketOpen: (websocketContext: string) => void;
  private readonly onDidWebSocketClose: (event: CloseEvent) => void;

  constructor(callbacks: {
    onDidWebSocketFailing: (websocketContext: string) => void;
    onDidWebSocketOpen: (websocketContext: string) => void;
    onDidWebSocketClose: (event: CloseEvent) => void;
  }) {
    this.onDidWebSocketFailing = callbacks.onDidWebSocketFailing;
    this.onDidWebSocketOpen = callbacks.onDidWebSocketOpen;
    this.onDidWebSocketClose = callbacks.onDidWebSocketClose;
  }

  /**
   * Performs connection to the pointed entrypoint.
   */
  connect(): Promise<any> {
    const deferred = getDefer();
    if (this.websocketStream) {
      return Promise.resolve();
    }
    const websocketContext = `${prefix}/websocket`;
    const origin = new URL(window.location.href).origin;
    const location = origin.replace('http', 'ws') + websocketContext;
    this.websocketStream = new ReconnectingWebSocket(location, [], {
      connectionTimeout: 20000,
      minReconnectionDelay: 2000,
    });

    this.websocketStream.addEventListener('open', () => {
      this.onDidWebSocketOpen(websocketContext);
      deferred.resolve();
    });
    this.websocketStream.addEventListener('close', event => {
      this.onDidWebSocketClose(event as CloseEvent);
    });
    this.websocketStream.addEventListener('error', event => {
      console.log(`WebSocket client '${websocketContext}' Error: ${event.message}`);
      this.onDidWebSocketFailing(websocketContext);
      deferred.reject();
    });
    this.websocketStream.addEventListener('message', event => {
      const { channel, message } = JSON.parse(event.data) as PublishMessage;
      if (channel && message) {
        this.saveResourceVersion(message);
        this.callHandlers(channel, message);
      }
    });
    return deferred.promise;
  }

  /**
   * Performs closing the connection.
   * @param code close code
   */
  disconnect(code?: number): void {
    if (this.websocketStream) {
      this.websocketStream.close(code ? code : undefined);
    }
  }

  /**
   * Adds a listener on an event.
   * @param  channel
   * @param  handler
   */
  addListener(channel: string, handler: Handler): void {
    if (!this.handlers[channel]) {
      this.handlers[channel] = [];
    }
    this.handlers[channel].push(handler);
  }

  /**
   * Removes a listener.
   * @param event
   * @param handler
   */
  removeListener(event: string, handler: Handler): void {
    if (this.handlers[event]) {
      const index = this.handlers[event].indexOf(handler);
      if (index !== -1) {
        this.handlers[event].splice(index, 1);
      }
    }
  }

  private sleep(ms: number): Promise<any> {
    return new Promise<any>(resolve => setTimeout(resolve, ms));
  }

  /**
   * Sends pointed data.
   * @param data to be sent
   */
  async subscribe(data: SubscribeMessage): Promise<void> {
    while (this.websocketStream.readyState !== this.websocketStream.OPEN) {
      await this.sleep(1000);
    }

    data.params.resourceVersion = this.getLatestResourceVersion(data.params.resourceVersion);

    return this.websocketStream.send(JSON.stringify(data));
  }

  private callHandlers(channel: string, data: unknown): void {
    if (this.handlers[channel] && this.handlers[channel].length > 0) {
      this.handlers[channel].forEach((handler: Handler) => handler(data));
    }
  }

  private getLatestResourceVersion(resourceVersion: string | undefined): string | undefined {
    if (!this.resourceVersion) {
      return resourceVersion;
    }
    if (!resourceVersion) {
      return this.resourceVersion.toString();
    }

    const resourceVersionNum = parseInt(resourceVersion, 10) || 0;
    this.resourceVersion = Math.max(resourceVersionNum, this.resourceVersion);
    return this.resourceVersion.toString();
  }

  private saveResourceVersion(message: PublishMessage['message']): void {
    if (typeof message === 'string') {
      return;
    }

    const resourceVersion = message.metadata?.resourceVersion || '0';
    const resourceVersionNum = parseInt(resourceVersion, 10) || 0;
    this.resourceVersion = Math.max(resourceVersionNum, this.resourceVersion);
  }
}
