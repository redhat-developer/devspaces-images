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
import WS from 'jest-websocket-mock';

import { delay } from '@/services/helpers/delay';

import { ConnectionEvent, WebsocketClient } from '..';

// mute console logs
console.log = jest.fn();
console.warn = jest.fn();

describe('websocketClient', () => {
  beforeEach(() => {
    // do not use fake timers, because it causes issues with jest-websocket-mock
    // jest.useFakeTimers();
  });

  afterEach(() => {
    WS.clean();
    jest.clearAllMocks();
  });

  describe('connection events', () => {
    describe('establishing connection', () => {
      const handleConnectionOpen = jest.fn();

      it('should connect to websocket and call listener for the OPEN event once', async () => {
        const websocketClient = new WebsocketClient();
        const serverMock = new WS('ws://localhost/dashboard/api/websocket');

        websocketClient.addConnectionEventListener(ConnectionEvent.OPEN, handleConnectionOpen);

        websocketClient.connect();
        const ws = await serverMock.connected;

        expect(ws).toBeDefined();
        expect(handleConnectionOpen).toHaveBeenCalledTimes(1);
      });

      it('should reconnect to websocket when server closes the connection', async () => {
        const websocketClient = new WebsocketClient();
        const serverMock = new WS('ws://localhost/dashboard/api/websocket');

        websocketClient.addConnectionEventListener(ConnectionEvent.OPEN, handleConnectionOpen);

        websocketClient.connect();
        const ws = await serverMock.connected;

        expect(ws).toBeDefined();
        expect(handleConnectionOpen).toHaveBeenCalledTimes(1);

        serverMock.close();
        await serverMock.closed;

        const serverMockNext = new WS('ws://localhost/dashboard/api/websocket');
        const wsNext = await serverMockNext.connected;

        expect(wsNext).toBeDefined();
        expect(handleConnectionOpen).toHaveBeenCalledTimes(2);
      });

      it('should reconnect to websocket when receives "error" event', async () => {
        const websocketClient = new WebsocketClient();
        const serverMock = new WS('ws://localhost/dashboard/api/websocket');

        const handleConnectionOpen = jest.fn();
        websocketClient.addConnectionEventListener(ConnectionEvent.OPEN, handleConnectionOpen);

        const handleConnectionError = jest.fn();
        websocketClient.addConnectionEventListener(ConnectionEvent.ERROR, handleConnectionError);

        await websocketClient.connect();
        const ws = await serverMock.connected;

        expect(ws).toBeDefined();
        expect(handleConnectionOpen).toHaveBeenCalledTimes(1);

        serverMock.error();
        await serverMock.closed;

        expect(handleConnectionError).toHaveBeenCalledTimes(1);

        const serverMockNext = new WS('ws://localhost/dashboard/api/websocket');
        const wsNext = await serverMockNext.connected;
        await delay(1000);

        expect(wsNext).toBeDefined();
        expect(handleConnectionOpen).toHaveBeenCalledTimes(2);
      });

      it('should return the same connection ready promise when called', async () => {
        const websocketClient = new WebsocketClient();
        const serverMock = new WS('ws://localhost/dashboard/api/websocket');

        websocketClient.addConnectionEventListener(ConnectionEvent.OPEN, handleConnectionOpen);

        const readyPromise1 = websocketClient.connect();
        const readyPromise2 = websocketClient.connect();

        expect(readyPromise1).toStrictEqual(readyPromise2);

        await serverMock.connected;
        const readyPromise3 = websocketClient.connect();

        expect(readyPromise1).toStrictEqual(readyPromise3);
      });
    });

    describe('getting connection closed', () => {
      it('should call the listener for the CLOSE event', async () => {
        const websocketClient = new WebsocketClient();
        const serverMock = new WS('ws://localhost/dashboard/api/websocket');

        const handleConnectionClose = jest.fn();
        websocketClient.addConnectionEventListener(ConnectionEvent.CLOSE, handleConnectionClose);

        websocketClient.connect();
        const ws = await serverMock.connected;

        expect(ws).toBeDefined();
        expect(handleConnectionClose).toHaveBeenCalledTimes(0);

        serverMock.close();
        await serverMock.closed;

        expect(handleConnectionClose).toHaveBeenCalledTimes(1);
      });
    });

    describe('getting connection error', () => {
      it('should call listener for the ERROR event', async () => {
        const websocketClient = new WebsocketClient();
        const serverMock = new WS('ws://localhost/dashboard/api/websocket');

        const handleConnectionError = jest.fn();
        websocketClient.addConnectionEventListener(ConnectionEvent.ERROR, handleConnectionError);

        websocketClient.connect();
        const ws = await serverMock.connected;

        expect(ws).toBeDefined();
        expect(handleConnectionError).toHaveBeenCalledTimes(0);

        serverMock.error();

        expect(handleConnectionError).toHaveBeenCalledTimes(1);
      });

      describe('past event notification', () => {
        it('should not call the listener', async () => {
          const websocketClient = new WebsocketClient();
          const serverMock = new WS('ws://localhost/dashboard/api/websocket');

          websocketClient.connect();
          const ws = await serverMock.connected;

          expect(ws).toBeDefined();

          serverMock.error();

          const handleConnectionError = jest.fn();
          websocketClient.addConnectionEventListener(ConnectionEvent.ERROR, handleConnectionError);

          expect(handleConnectionError).toHaveBeenCalledTimes(0);
        });

        it('should call the listener', async () => {
          const websocketClient = new WebsocketClient();
          const serverMock = new WS('ws://localhost/dashboard/api/websocket');

          websocketClient.connect();
          const ws = await serverMock.connected;

          expect(ws).toBeDefined();

          serverMock.error();

          const handleConnectionError = jest.fn();
          websocketClient.addConnectionEventListener(
            ConnectionEvent.ERROR,
            handleConnectionError,
            true,
          );

          expect(handleConnectionError).toHaveBeenCalledTimes(1);
        });
      });
    });

    it('should remove the listener', async () => {
      const websocketClient = new WebsocketClient();
      const serverMock = new WS('ws://localhost/dashboard/api/websocket');

      const handleConnectionOpen = jest.fn();
      websocketClient.addConnectionEventListener(ConnectionEvent.OPEN, handleConnectionOpen);

      websocketClient.connect();
      const ws = await serverMock.connected;

      expect(ws).toBeDefined();
      expect(handleConnectionOpen).toHaveBeenCalledTimes(1);

      websocketClient.removeConnectionEventListener(ConnectionEvent.OPEN, handleConnectionOpen);

      serverMock.close();
      await serverMock.closed;

      const serverMockNext = new WS('ws://localhost/dashboard/api/websocket');
      const wsNext = await serverMockNext.connected;

      expect(wsNext).toBeDefined();
      expect(handleConnectionOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscriptions', () => {
    const namespace = 'user-che';
    const getResourceVersion = () => '1234';

    describe('adding subscriptions', () => {
      it('should add a subscription and send the subscribe message', async () => {
        const websocketClient = new WebsocketClient();
        const serverMock = new WS('ws://localhost/dashboard/api/websocket');

        const addSubscriptionSpy = jest.spyOn(
          (websocketClient as any).subscriptionsManager,
          'addSubscription',
        );

        websocketClient.connect();
        await serverMock.connected;

        websocketClient.subscribeToChannel(api.webSocket.Channel.EVENT, namespace, {
          getResourceVersion,
        });

        expect(addSubscriptionSpy).toHaveBeenCalledTimes(1);

        await new Promise(resolve => setTimeout(resolve, 1000));
        expect(serverMock).toHaveReceivedMessages([
          JSON.stringify({
            method: 'SUBSCRIBE',
            channel: 'event',
            params: { namespace: 'user-che', resourceVersion: '1234' },
          }),
        ]);
      });

      it('should add a subscription but not send the subscribe message #1', async () => {
        const websocketClient = new WebsocketClient();
        const serverMock = new WS('ws://localhost/dashboard/api/websocket');

        const addSubscriptionSpy = jest.spyOn(
          (websocketClient as any).subscriptionsManager,
          'addSubscription',
        );

        // do not connect to the server

        websocketClient.subscribeToChannel(api.webSocket.Channel.EVENT, namespace, {
          getResourceVersion,
        });

        expect(addSubscriptionSpy).toHaveBeenCalledTimes(1);

        await new Promise(resolve => setTimeout(resolve, 1000));
        expect(serverMock).toHaveReceivedMessages([]);
      });

      it('should add a subscription but not send the subscribe message #2', async () => {
        const websocketClient = new WebsocketClient();
        const serverMock = new WS('ws://localhost/dashboard/api/websocket');

        const addSubscriptionSpy = jest.spyOn(
          (websocketClient as any).subscriptionsManager,
          'addSubscription',
        );

        websocketClient.connect();
        // do not wait for the connection to be established

        websocketClient.subscribeToChannel(api.webSocket.Channel.EVENT, namespace, {
          getResourceVersion,
        });

        expect(addSubscriptionSpy).toHaveBeenCalledTimes(1);

        await new Promise(resolve => setTimeout(resolve, 1000));
        expect(serverMock).toHaveReceivedMessages([]);
      });
    });

    describe('removing subscriptions', () => {
      it('should remove a subscription and send the unsubscribe message', async () => {
        const websocketClient = new WebsocketClient();
        const serverMock = new WS('ws://localhost/dashboard/api/websocket');

        const removeSubscriptionSpy = jest.spyOn(
          (websocketClient as any).subscriptionsManager,
          'removeSubscription',
        );

        websocketClient.connect();
        await serverMock.connected;

        websocketClient.unsubscribeFromChannel(api.webSocket.Channel.EVENT);

        expect(removeSubscriptionSpy).toHaveBeenCalledTimes(1);

        await new Promise(resolve => setTimeout(resolve, 1000));
        expect(serverMock).toHaveReceivedMessages([
          JSON.stringify({
            method: 'UNSUBSCRIBE',
            channel: 'event',
            params: {},
          }),
        ]);
      });

      it('should remove a subscription but not send the unsubscribe message #1', async () => {
        const websocketClient = new WebsocketClient();
        const serverMock = new WS('ws://localhost/dashboard/api/websocket');

        const removeSubscriptionSpy = jest.spyOn(
          (websocketClient as any).subscriptionsManager,
          'removeSubscription',
        );

        // do not connect to the server

        websocketClient.unsubscribeFromChannel(api.webSocket.Channel.EVENT);

        expect(removeSubscriptionSpy).toHaveBeenCalledTimes(1);

        await new Promise(resolve => setTimeout(resolve, 1000));
        expect(serverMock).toHaveReceivedMessages([]);
      });

      it('should remove a subscription but not send the unsubscribe message #2', async () => {
        const websocketClient = new WebsocketClient();
        const serverMock = new WS('ws://localhost/dashboard/api/websocket');

        const removeSubscriptionSpy = jest.spyOn(
          (websocketClient as any).subscriptionsManager,
          'removeSubscription',
        );

        websocketClient.connect();
        // do not wait for the connection to be established

        websocketClient.unsubscribeFromChannel(api.webSocket.Channel.EVENT);

        expect(removeSubscriptionSpy).toHaveBeenCalledTimes(1);

        await new Promise(resolve => setTimeout(resolve, 1000));
        expect(serverMock).toHaveReceivedMessages([]);
      });
    });

    describe('resubscribing', () => {
      it('should get existing subscriptions and send messages', async () => {
        const websocketClient = new WebsocketClient();
        const serverMock = new WS('ws://localhost/dashboard/api/websocket');

        const getSubscriptionsSpy = jest.spyOn(
          (websocketClient as any).subscriptionsManager,
          'getSubscriptions',
        );

        websocketClient.subscribeToChannel(api.webSocket.Channel.EVENT, namespace, {
          getResourceVersion,
        });
        websocketClient.subscribeToChannel(api.webSocket.Channel.DEV_WORKSPACE, namespace, {
          getResourceVersion,
        });

        websocketClient.connect();
        await serverMock.connected;

        expect(getSubscriptionsSpy).toHaveBeenCalledTimes(1);

        await new Promise(resolve => setTimeout(resolve, 1000));
        expect(serverMock).toHaveReceivedMessages([
          JSON.stringify({
            method: 'SUBSCRIBE',
            channel: 'event',
            params: { namespace: 'user-che', resourceVersion: '1234' },
          }),
          JSON.stringify({
            method: 'SUBSCRIBE',
            channel: 'devWorkspace',
            params: { namespace: 'user-che', resourceVersion: '1234' },
          }),
        ]);
      });

      it('should not send any messages #1', async () => {
        const websocketClient = new WebsocketClient();
        const serverMock = new WS('ws://localhost/dashboard/api/websocket');

        const getSubscriptionsSpy = jest.spyOn(
          (websocketClient as any).subscriptionsManager,
          'getSubscriptions',
        );

        websocketClient.subscribeToChannel(api.webSocket.Channel.EVENT, namespace, {
          getResourceVersion,
        });

        (websocketClient as any).reSubscribeToChannels();
        // do not connect to the server

        expect(getSubscriptionsSpy).toHaveBeenCalledTimes(1);

        await new Promise(resolve => setTimeout(resolve, 1000));
        expect(serverMock).toHaveReceivedMessages([]);
      });

      it('should not send any messages #1', async () => {
        const websocketClient = new WebsocketClient();
        const serverMock = new WS('ws://localhost/dashboard/api/websocket');

        const getSubscriptionsSpy = jest.spyOn(
          (websocketClient as any).subscriptionsManager,
          'getSubscriptions',
        );

        websocketClient.subscribeToChannel(api.webSocket.Channel.EVENT, namespace, {
          getResourceVersion,
        });

        websocketClient.connect();
        (websocketClient as any).reSubscribeToChannels();
        // do not wait for the connection to be established

        expect(getSubscriptionsSpy).toHaveBeenCalledTimes(1);

        await new Promise(resolve => setTimeout(resolve, 1000));
        expect(serverMock).toHaveReceivedMessages([]);
      });
    });
  });

  describe('handling data messages', () => {
    it('should add a channel message listener', () => {
      const websocketClient = new WebsocketClient();

      const addListenerSpy = jest.spyOn((websocketClient as any).messageHandler, 'addListener');

      const channel = api.webSocket.Channel.EVENT;
      const listener = () => undefined;
      websocketClient.addChannelMessageListener(channel, listener);

      expect(addListenerSpy).toHaveBeenCalledWith(channel, listener);
    });

    it('should notify a channel listener', async () => {
      const websocketClient = new WebsocketClient();
      const serverMock = new WS('ws://localhost/dashboard/api/websocket');

      const notifyListenersSpy = jest.spyOn(
        (websocketClient as any).messageHandler,
        'notifyListeners',
      );

      websocketClient.connect();
      await serverMock.connected;

      serverMock.send('test message');

      expect(notifyListenersSpy).toHaveBeenCalledWith(
        expect.objectContaining({ data: 'test message' }),
      );
    });
  });
});
