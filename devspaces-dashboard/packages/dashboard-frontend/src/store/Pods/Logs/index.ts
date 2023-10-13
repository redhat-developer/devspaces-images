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
import { V1Pod } from '@kubernetes/client-node';
import { Action, Reducer } from 'redux';

import { container } from '@/inversify.config';
import { WebsocketClient } from '@/services/backend-client/websocketClient';
import { ChannelListener } from '@/services/backend-client/websocketClient/messageHandler';
import { AppThunk } from '@/store';
import { createObject } from '@/store/helpers';
import { selectDefaultNamespace } from '@/store/InfrastructureNamespaces/selectors';
import { selectAllPods } from '@/store/Pods/selectors';

export type ContainerLogs = {
  logs: string;
  failure: boolean;
};

export interface State {
  logs: {
    [podName: string]:
      | {
          containers: {
            [containerName: string]: ContainerLogs | undefined;
          };
          error?: string;
        }
      | undefined;
  };
}

export enum Type {
  RECEIVE_LOGS = 'RECEIVE_LOGS',
  DELETE_LOGS = 'DELETE_LOGS',
}

export interface ReceiveLogsAction {
  type: Type.RECEIVE_LOGS;
  podName: string;
  containerName: string;
  logs: string;
  failure: boolean;
}

export interface DeleteLogsAction {
  type: Type.DELETE_LOGS;
  podName: string;
}

export type KnownAction = ReceiveLogsAction | DeleteLogsAction;

export type ActionCreators = {
  watchPodLogs: (pod: V1Pod) => AppThunk<KnownAction, Promise<void>>;
  stopWatchingPodLogs: (pod: V1Pod) => AppThunk<KnownAction, Promise<void>>;

  handleWebSocketMessage: (
    message: api.webSocket.NotificationMessage,
  ) => AppThunk<KnownAction, Promise<void>>;
};

export const actionCreators: ActionCreators = {
  watchPodLogs:
    (pod: V1Pod): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      const podName = pod.metadata?.name;
      if (podName === undefined) {
        console.warn(`Can't watch pod logs: pod name is undefined.`, pod);
        throw new Error(`Can't watch pod logs: pod name is undefined`);
      }

      const defaultKubernetesNamespace = selectDefaultNamespace(getState());
      const namespace = defaultKubernetesNamespace.name;

      const websocketClient = container.get(WebsocketClient);
      await websocketClient.connect();

      if (websocketClient.hasChannelMessageListener(api.webSocket.Channel.LOGS) === false) {
        const listener: ChannelListener = message =>
          dispatch(actionCreators.handleWebSocketMessage(message));
        websocketClient.addChannelMessageListener(api.webSocket.Channel.LOGS, listener);
      }

      websocketClient.unsubscribeFromChannel(api.webSocket.Channel.LOGS);
      websocketClient.subscribeToChannel(api.webSocket.Channel.LOGS, namespace, {
        podName,
      });
    },

  stopWatchingPodLogs:
    (pod: V1Pod): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      const podName = pod.metadata?.name;
      if (podName === undefined) {
        throw new Error(`Can't stop watching pod logs: pod name is undefined`);
      }

      const websocketClient = container.get(WebsocketClient);
      websocketClient.unsubscribeFromChannel(api.webSocket.Channel.LOGS);

      dispatch({
        type: Type.DELETE_LOGS,
        podName,
      });
    },

  handleWebSocketMessage:
    (message: api.webSocket.NotificationMessage): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      if (api.webSocket.isStatusMessage(message)) {
        const { params, status } = message;

        if (!api.webSocket.isWebSocketSubscribeLogsParams(params)) {
          console.debug('WebSocket(LOGS): unexpected message:', message);
          return;
        }

        const errorMessage = status.message || 'Unknown error while watching logs';
        console.debug(`WebSocket(LOGS): status code ${status.code}, reason: ${errorMessage}`);

        /* if container name is specified, then it's a single container logs. */

        if (params.containerName) {
          dispatch({
            type: Type.RECEIVE_LOGS,
            podName: params.podName,
            containerName: params.containerName,
            logs: status.message || errorMessage,
            failure: true,
          });
          return;
        }

        /* If container name is not specified, then backend failed to get pod to watch. We need to check if pod exists, and resubscribe to the channel. */

        const websocketClient = container.get(WebsocketClient);
        websocketClient.unsubscribeFromChannel(api.webSocket.Channel.LOGS);

        const allPods = selectAllPods(getState());
        if (allPods.find(pod => pod.metadata?.name === params.podName) === undefined) {
          console.debug('WebSocket(LOGS): pod not found, stop watching logs:', params.podName);
          return;
        }
        websocketClient.subscribeToChannel(api.webSocket.Channel.LOGS, params.namespace, {
          podName: params.podName,
        });
        return;
      }

      if (api.webSocket.isLogsMessage(message)) {
        const { containerName, logs, podName } = message;

        dispatch({
          type: Type.RECEIVE_LOGS,
          podName,
          containerName,
          logs,
          failure: false,
        });

        return;
      }

      console.warn('WebSocket: unexpected message:', message);
    },
};

const unloadedState: State = {
  logs: {},
};

export const reducer: Reducer<State> = (
  state: State | undefined,
  incomingAction: Action,
): State => {
  if (state === undefined) {
    state = unloadedState;
  }

  const action = incomingAction as KnownAction;
  switch (action.type) {
    case Type.RECEIVE_LOGS: {
      const _pod = state.logs[action.podName];
      const _containers = _pod?.containers;
      const _containerLogs = _containers?.[action.containerName];
      const _logs = action.failure === _containerLogs?.failure ? _containerLogs.logs : '';
      return createObject<State>(state, {
        logs: createObject(state.logs, {
          [action.podName]: createObject<typeof _pod>(_pod, {
            error: undefined,
            containers: createObject<typeof _containers>(_containers, {
              [action.containerName]: {
                logs: _logs + action.logs,
                failure: action.failure,
              },
            }),
          }),
        }),
      });
    }
    case Type.DELETE_LOGS:
      return createObject<State>(state, {
        logs: createObject(state.logs, {
          [action.podName]: undefined,
        }),
      });
    default:
      return state;
  }
};
