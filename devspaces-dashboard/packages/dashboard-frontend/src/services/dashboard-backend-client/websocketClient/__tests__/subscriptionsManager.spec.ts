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
import { WebSocketSubscriptionsManager } from '../subscriptionsManager';

describe('subscriptionsManager', () => {
  let subscriptionsManager: WebSocketSubscriptionsManager;

  beforeEach(() => {
    subscriptionsManager = new WebSocketSubscriptionsManager();
  });

  it('should add a subscription', () => {
    const subscribeMessage = subscriptionsManager.addSubscription(
      api.webSocket.Channel.EVENT,
      'user-che',
      () => '1234',
    );

    expect(subscribeMessage).toEqual({
      method: 'SUBSCRIBE',
      channel: api.webSocket.Channel.EVENT,
      params: {
        namespace: 'user-che',
        resourceVersion: '1234',
      },
    });

    const allSubscribeMessages = subscriptionsManager.getSubscriptions();
    expect(allSubscribeMessages).toHaveLength(1);
    expect(allSubscribeMessages[0]).toEqual(subscribeMessage);
  });

  it('should not add the same subscription', () => {
    const subscribeMessage1 = subscriptionsManager.addSubscription(
      api.webSocket.Channel.EVENT,
      'user-che',
      () => '1234',
    );
    const subscribeMessage2 = subscriptionsManager.addSubscription(
      api.webSocket.Channel.EVENT,
      'user-che',
      () => '1234',
    );

    expect(subscribeMessage1).toEqual(subscribeMessage2);

    const allSubscribeMessages = subscriptionsManager.getSubscriptions();
    expect(allSubscribeMessages).toHaveLength(1);
    expect(allSubscribeMessages[0]).toEqual(subscribeMessage1);
  });

  it('should remove a subscription', () => {
    subscriptionsManager.addSubscription(api.webSocket.Channel.EVENT, 'user-che', () => '1234');

    const allSubscribeMessages = subscriptionsManager.getSubscriptions();
    expect(allSubscribeMessages).toHaveLength(1);

    const unsubscribeMessage = subscriptionsManager.removeSubscription(api.webSocket.Channel.EVENT);

    expect(unsubscribeMessage).toEqual({
      method: 'UNSUBSCRIBE',
      channel: api.webSocket.Channel.EVENT,
      params: {},
    });

    const allSubscribeMessagesNext = subscriptionsManager.getSubscriptions();
    expect(allSubscribeMessagesNext).toHaveLength(0);
  });
});
