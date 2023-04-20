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
export type ReturnResourceVersion = () => ResourceVersion;

export type SubscriptionArgs =
  | [
      channel:
        | api.webSocket.Channel.DEV_WORKSPACE
        | api.webSocket.Channel.EVENT
        | api.webSocket.Channel.POD,
      namespace: string,
      options: { getResourceVersion: ReturnResourceVersion },
    ]
  | [channel: api.webSocket.Channel.LOGS, namespace: string, options: { podName: string }];

/**
 * This class manages subscriptions to web socket channels.
 */
export class WebSocketSubscriptionsManager {
  private readonly subscriptions: Map<api.webSocket.Channel, SubscriptionArgs> = new Map();

  /**
   * Adds the subscription for the given channel and returns the subscribe message.
   */
  public addSubscription(...args: SubscriptionArgs): api.webSocket.SubscribeMessage | undefined {
    const [channel] = args;
    if (this.subscriptions.has(channel) === false) {
      // store subscription to be able to re-subscribe later
      this.subscriptions.set(channel, args);
    }
    return this.buildSubscribeMessage(...args);
  }

  private buildSubscribeMessage(...args: SubscriptionArgs): api.webSocket.SubscribeMessage {
    const [channel, namespace] = args;
    if (channel === api.webSocket.Channel.LOGS) {
      const options = args[2];
      return {
        method: 'SUBSCRIBE',
        channel,
        params: {
          namespace,
          ...options,
        },
      };
    } else {
      const options = args[2];
      return {
        method: 'SUBSCRIBE',
        channel,
        params: {
          namespace,
          resourceVersion: options.getResourceVersion(),
        },
      };
    }
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
    this.subscriptions.forEach(subscriptionArgs => {
      messages.push(this.buildSubscribeMessage(...subscriptionArgs));
    });
    return messages;
  }
}
