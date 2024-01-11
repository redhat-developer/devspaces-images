/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
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
import MockWebSocket from 'jest-websocket-mock';
import WS from 'ws';

import { SubscriptionManager } from '@/services/SubscriptionManager';
import { NotificationMessage } from '@/services/types/Observer';

describe('SubscriptionManager', () => {
  const channel = api.webSocket.Channel.DEV_WORKSPACE;

  const ws = new MockWebSocket('ws://localhost') as unknown as WS;
  const spyWsSend = jest.spyOn(ws, 'send');

  let subscriptionManager: SubscriptionManager;

  beforeEach(() => {
    subscriptionManager = new SubscriptionManager(ws);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('subscribe and update', () => {
    subscriptionManager.subscribe(channel);

    const message = {
      eventPhase: api.webSocket.EventPhase.ADDED,
    } as NotificationMessage;
    subscriptionManager.update(channel, message);

    expect(spyWsSend).toHaveBeenCalled();
  });

  test('unsubscribe all channels', () => {
    subscriptionManager.subscribe(channel);
    subscriptionManager.unsubscribeAll();

    const message = {
      eventPhase: api.webSocket.EventPhase.ADDED,
    } as NotificationMessage;
    subscriptionManager.update(channel, message);

    expect(spyWsSend).not.toHaveBeenCalled();
  });
});
