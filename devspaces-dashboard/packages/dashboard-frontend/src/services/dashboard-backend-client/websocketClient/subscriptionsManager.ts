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

type ResourceVersion = string;
type Namespace = string;
export type ReturnResourceVersion = () => ResourceVersion;

/**
 * This class manages subscriptions to web socket channels.
 */
export class WebSocketSubscriptionsManager {
  private readonly subscriptions: Map<api.webSocket.Channel, [Namespace, ReturnResourceVersion]> =
    new Map();

  /**
   * Adds the subscription for the given channel and returns the subscribe message.
   */
  public addSubscription(
    channel: api.webSocket.Channel,
    namespace: string,
    getResourceVersion: ReturnResourceVersion,
  ): api.webSocket.SubscribeMessage | undefined {
    if (this.subscriptions.has(channel) === false) {
      // store subscription to be able to re-subscribe later
      this.subscriptions.set(channel, [namespace, getResourceVersion]);
    }

    return this.buildSubscribeMessage(channel, namespace, getResourceVersion);
  }

  private buildSubscribeMessage(
    channel: api.webSocket.Channel,
    namespace: string,
    getResourceVersion: ReturnResourceVersion,
  ): api.webSocket.SubscribeMessage {
    return {
      method: 'SUBSCRIBE',
      channel,
      params: {
        namespace,
        resourceVersion: getResourceVersion(),
      },
    };
  }

  /**
   * Removes the subscription for the given channel and returns the unsubscribe message.
   */
  public removeSubscription(channel: api.webSocket.Channel): api.webSocket.UnsubscribeMessage {
    this.subscriptions.delete(channel);

    return this.buildUnsubscribeMessage(channel);
  }

  private buildUnsubscribeMessage(
    channel: api.webSocket.Channel,
  ): api.webSocket.UnsubscribeMessage {
    return {
      method: 'UNSUBSCRIBE',
      channel,
      params: {},
    };
  }

  /**
   * Returns the subscribe messages for all subscriptions.
   */
  public getSubscriptions(): api.webSocket.SubscribeMessage[] {
    const messages: api.webSocket.SubscribeMessage[] = [];
    this.subscriptions.forEach(([namespace, getResourceVersion], channel) => {
      messages.push(this.buildSubscribeMessage(channel, namespace, getResourceVersion));
    });
    return messages;
  }
}
