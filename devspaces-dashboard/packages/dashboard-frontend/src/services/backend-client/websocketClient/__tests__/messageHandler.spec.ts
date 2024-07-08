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
import { CoreV1Event } from '@kubernetes/client-node';

import { WebSocketMessageHandler } from '@/services/backend-client/websocketClient/messageHandler';

describe('messageHandler', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be able to add and remove listeners, and notify them', () => {
    const messageHandler = new WebSocketMessageHandler();
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const listener3 = jest.fn();

    messageHandler.addListener(api.webSocket.Channel.EVENT, listener1);
    messageHandler.addListener(api.webSocket.Channel.EVENT, listener2);
    messageHandler.addListener(api.webSocket.Channel.DEV_WORKSPACE, listener3);

    const data = {
      channel: api.webSocket.Channel.EVENT,
      message: {
        eventPhase: api.webSocket.EventPhase.ADDED,
        event: {} as CoreV1Event,
      },
    } as api.webSocket.EventData;
    const messageEvent = {
      data: JSON.stringify(data),
    } as MessageEvent<string>;
    messageHandler.notifyListeners(messageEvent);

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(listener3).not.toHaveBeenCalled();

    messageHandler.removeListener(api.webSocket.Channel.EVENT, listener1);
    messageHandler.removeListener(api.webSocket.Channel.DEV_WORKSPACE, listener3);

    listener1.mockClear();
    listener2.mockClear();
    listener3.mockClear();

    messageHandler.notifyListeners(messageEvent);

    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(listener3).not.toHaveBeenCalled();
  });

  it('should not throw when removing a non-attached listeners', () => {
    const messageHandler = new WebSocketMessageHandler();
    const listener = jest.fn();

    expect(() =>
      messageHandler.removeListener(api.webSocket.Channel.EVENT, listener),
    ).not.toThrow();
  });

  it('should not throw when no listeners to notify for a channel', () => {
    const messageHandler = new WebSocketMessageHandler();

    const data = {
      channel: api.webSocket.Channel.EVENT,
      message: {
        eventPhase: api.webSocket.EventPhase.ADDED,
        event: {} as CoreV1Event,
      },
    } as api.webSocket.EventData;
    const messageEvent = {
      data: JSON.stringify(data),
    } as MessageEvent<string>;

    expect(() => messageHandler.notifyListeners(messageEvent)).not.toThrow();
  });

  it('should log a warning when a message is not a valid JSON', () => {
    const messageHandler = new WebSocketMessageHandler();
    const messageEvent = {
      data: 'not a valid JSON',
    } as MessageEvent<string>;

    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
    messageHandler.notifyListeners(messageEvent);
    expect(consoleWarn).toHaveBeenCalledWith(
      "[WARN] Can't parse the WS message payload:",
      'not a valid JSON',
    );
  });

  it('should log a warning when a message payload is not expected', () => {
    const messageHandler = new WebSocketMessageHandler();
    const data = {
      channel: api.webSocket.Channel.EVENT,
      message: {},
    } as api.webSocket.EventData;
    const messageEvent = {
      data: JSON.stringify(data),
    } as MessageEvent<string>;

    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
    messageHandler.notifyListeners(messageEvent);
    expect(consoleWarn).toHaveBeenCalledWith(
      '[WARN] Unexpected WS message payload:',
      '{"channel":"event","message":{}}',
    );
  });
});
