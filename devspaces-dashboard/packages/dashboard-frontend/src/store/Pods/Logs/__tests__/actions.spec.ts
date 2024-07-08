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

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { api } from '@eclipse-che/common';
import { CoreV1Event, V1Pod, V1Status } from '@kubernetes/client-node';
import { MockStoreEnhanced } from 'redux-mock-store';
import { ThunkDispatch } from 'redux-thunk';

import { container } from '@/inversify.config';
import { WebsocketClient } from '@/services/backend-client/websocketClient';
import { AppState } from '@/store';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

import * as testStore from '..';

describe('Pod logs store, actions', () => {
  const podName = 'pod1';
  const containerName = 'container1';
  const initContainerName = 'initContainer1';
  const namespace = 'user-che';
  let pod: V1Pod;

  let appStore: MockStoreEnhanced<
    AppState,
    ThunkDispatch<AppState, undefined, testStore.KnownAction>
  >;

  beforeEach(() => {
    pod = {
      kind: 'Pod',
      metadata: {
        name: podName,
        namespace: 'user-che',
      },
      spec: {
        containers: [
          {
            name: containerName,
          },
        ],
        initContainers: [
          {
            name: initContainerName,
          },
        ],
      },
    } as V1Pod;

    appStore = new FakeStoreBuilder()
      .withInfrastructureNamespace([{ attributes: { phase: 'Active' }, name: namespace }])
      .build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, testStore.KnownAction>
    >;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('start/stop watching logs', () => {
    beforeEach(() => {
      container.snapshot();
    });

    afterEach(() => {
      container.restore();
    });

    it('should throw an error when start watching logs', async () => {
      delete pod.metadata;

      console.warn = jest.fn();

      const watch = () => appStore.dispatch(testStore.actionCreators.watchPodLogs(pod));

      expect(watch).rejects.toThrowError(`Can't watch pod logs: pod name is undefined`);
    });

    test('start watching pod logs', async () => {
      const websocketClient = container.get(WebsocketClient);

      jest.spyOn(websocketClient, 'connect').mockImplementation(() => Promise.resolve());
      jest.spyOn(websocketClient, 'addChannelMessageListener').mockImplementation(() => undefined);
      jest.spyOn(websocketClient, 'subscribeToChannel').mockImplementation(() => undefined);
      jest.spyOn(websocketClient, 'unsubscribeFromChannel').mockImplementation(() => undefined);

      await appStore.dispatch(testStore.actionCreators.watchPodLogs(pod));

      expect(websocketClient.connect).toHaveBeenCalled();
      expect(websocketClient.addChannelMessageListener).toHaveBeenCalledWith(
        api.webSocket.Channel.LOGS,
        expect.any(Function),
      );
      expect(websocketClient.unsubscribeFromChannel).toHaveBeenCalledWith(
        api.webSocket.Channel.LOGS,
      );
      expect(websocketClient.subscribeToChannel).toHaveBeenCalledWith(
        api.webSocket.Channel.LOGS,
        namespace,
        { podName },
      );
    });

    it('should throw an error when stop watching logs', async () => {
      delete pod.metadata;

      const fetch = () => appStore.dispatch(testStore.actionCreators.stopWatchingPodLogs(pod));

      expect(fetch).rejects.toThrowError(`Can't stop watching pod logs: pod name is undefined`);
    });

    test('stop watching logs', async () => {
      const websocketClient = container.get(WebsocketClient);

      jest.spyOn(websocketClient, 'unsubscribeFromChannel').mockImplementation(() => undefined);

      await appStore.dispatch(testStore.actionCreators.stopWatchingPodLogs(pod));

      expect(websocketClient.unsubscribeFromChannel).toHaveBeenCalledWith(
        api.webSocket.Channel.LOGS,
      );
    });
  });

  describe('handle WebSocket messages', () => {
    describe('ADDED event phase', () => {
      it('should create RECEIVE_LOGS', () => {
        const logsMessage = {
          eventPhase: api.webSocket.EventPhase.ADDED,
          containerName,
          podName,
          logs: 'a few logs',
        } as api.webSocket.LogsMessage;

        appStore.dispatch(testStore.actionCreators.handleWebSocketMessage(logsMessage));

        const actions = appStore.getActions();

        const expectedActions: testStore.KnownAction[] = [
          {
            type: testStore.Type.RECEIVE_LOGS,
            containerName,
            podName,
            logs: logsMessage.logs,
            failure: false,
          },
        ];

        expect(actions).toStrictEqual(expectedActions);
      });
    });

    describe('ERROR event phase', () => {
      it('should create RECEIVE_LOGS action if `containerName` is defined', () => {
        const statusMessage = {
          eventPhase: api.webSocket.EventPhase.ERROR,
          params: {
            containerName,
            podName,
            namespace,
          },
          status: {
            kind: 'Status',
            message: 'an error message',
          } as V1Status,
        } as api.webSocket.StatusMessage;

        appStore.dispatch(testStore.actionCreators.handleWebSocketMessage(statusMessage));

        const actions = appStore.getActions();

        const expectedActions: testStore.KnownAction[] = [
          {
            type: testStore.Type.RECEIVE_LOGS,
            containerName,
            podName,
            logs: statusMessage.status.message!,
            failure: true,
          },
        ];

        expect(actions).toStrictEqual(expectedActions);
      });

      describe('resubscribe if failure', () => {
        it('should not resubscribe if pod not found', () => {
          const statusMessage = {
            eventPhase: api.webSocket.EventPhase.ERROR,
            params: {
              podName,
              namespace,
            },
            status: {
              kind: 'Status',
              message: 'an error message',
            } as V1Status,
          } as api.webSocket.StatusMessage;

          const websocketClient = container.get(WebsocketClient);
          const unsubscribeFromChannelSpy = jest
            .spyOn(websocketClient, 'unsubscribeFromChannel')
            .mockReturnValue(undefined);
          const subscribeToChannelSpy = jest
            .spyOn(websocketClient, 'subscribeToChannel')
            .mockReturnValue(undefined);

          /* no such pod in the store */
          appStore.dispatch(testStore.actionCreators.handleWebSocketMessage(statusMessage));

          const actions = appStore.getActions();

          const expectedActions: testStore.KnownAction[] = [];
          expect(actions).toStrictEqual(expectedActions);

          expect(unsubscribeFromChannelSpy).toHaveBeenCalledWith(api.webSocket.Channel.LOGS);
          expect(subscribeToChannelSpy).not.toHaveBeenCalledWith();
        });

        it('should not resubscribe if pod not found', () => {
          const statusMessage = {
            eventPhase: api.webSocket.EventPhase.ERROR,
            params: {
              podName,
              namespace,
            },
            status: {
              kind: 'Status',
              message: 'an error message',
            } as V1Status,
          } as api.webSocket.StatusMessage;

          const websocketClient = container.get(WebsocketClient);
          const unsubscribeFromChannelSpy = jest
            .spyOn(websocketClient, 'unsubscribeFromChannel')
            .mockReturnValue(undefined);
          const subscribeToChannelSpy = jest
            .spyOn(websocketClient, 'subscribeToChannel')
            .mockReturnValue(undefined);

          /* adding the pod in the store */
          const _appStore = new FakeStoreBuilder(appStore).withPods({ pods: [pod] }).build();

          _appStore.dispatch(testStore.actionCreators.handleWebSocketMessage(statusMessage));

          const actions = _appStore.getActions();

          const expectedActions: testStore.KnownAction[] = [];
          expect(actions).toStrictEqual(expectedActions);

          expect(unsubscribeFromChannelSpy).toHaveBeenCalledWith(api.webSocket.Channel.LOGS);
          expect(subscribeToChannelSpy).toHaveBeenCalledWith(
            api.webSocket.Channel.LOGS,
            namespace,
            {
              podName,
            },
          );
        });
      });
    });

    it('should skip messages that are neither `LogsMessage` nor `StatusMessage`', () => {
      const message = {
        eventPhase: api.webSocket.EventPhase.DELETED,
        event: {} as CoreV1Event,
      } as api.webSocket.EventMessage;

      console.warn = jest.fn();

      appStore.dispatch(testStore.actionCreators.handleWebSocketMessage(message));

      const actions = appStore.getActions();

      const expectedActions: testStore.KnownAction[] = [];

      expect(actions).toStrictEqual(expectedActions);
      expect(console.warn).toHaveBeenCalledWith('WebSocket: unexpected message:', message);
    });
  });
});
