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

import { api, helpers } from '@eclipse-che/common';
import { V1Pod } from '@kubernetes/client-node';
import { Action, Reducer } from 'redux';
import { AppThunk } from '..';
import { container } from '../../inversify.config';
import { fetchPods } from '../../services/dashboard-backend-client/podsApi';
import { WebsocketClient } from '../../services/dashboard-backend-client/websocketClient';
import { getNewerResourceVersion } from '../../services/helpers/resourceVersion';
import { createObject } from '../helpers';
import { selectDefaultNamespace } from '../InfrastructureNamespaces/selectors';
import { AUTHORIZED, SanityCheckAction } from '../sanityCheckMiddleware';
import isSamePod from './isSamePod';
import { selectPodsResourceVersion } from './selectors';

export interface State {
  isLoading: boolean;
  pods: V1Pod[];
  resourceVersion: string;
  error?: string;
}

export enum Type {
  REQUEST_PODS = 'REQUEST_PODS',
  RECEIVE_PODS = 'RECEIVE_PODS',
  RECEIVE_ERROR = 'RECEIVE_ERROR',
  RECEIVE_POD = 'RECEIVE_POD',
  MODIFY_POD = 'MODIFY_POD',
  DELETE_POD = 'DELETE_POD',
}

export interface RequestPodsAction extends Action, SanityCheckAction {
  type: Type.REQUEST_PODS;
}

export interface ReceivePodsAction {
  type: Type.RECEIVE_PODS;
  pods: V1Pod[];
  resourceVersion: string | undefined;
}

export interface ReceiveErrorAction {
  type: Type.RECEIVE_ERROR;
  error: string;
}

export interface ReceivePodAction {
  type: Type.RECEIVE_POD;
  pod: V1Pod;
}

export interface ModifyPodAction {
  type: Type.MODIFY_POD;
  pod: V1Pod;
}

export interface DeletePodAction {
  type: Type.DELETE_POD;
  pod: V1Pod;
}

export type KnownAction =
  | RequestPodsAction
  | ReceivePodsAction
  | ReceiveErrorAction
  | ReceivePodAction
  | ModifyPodAction
  | DeletePodAction;

export type ActionCreators = {
  requestPods: () => AppThunk<KnownAction, Promise<void>>;

  handleWebSocketMessage: (
    message: api.webSocket.NotificationMessage,
  ) => AppThunk<KnownAction, Promise<void>>;
};

export const actionCreators: ActionCreators = {
  requestPods:
    (): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      await dispatch({
        type: Type.REQUEST_PODS,
        check: AUTHORIZED,
      });

      const defaultKubernetesNamespace = selectDefaultNamespace(getState());
      const defaultNamespace = defaultKubernetesNamespace.name;

      try {
        const podsList = await fetchPods(defaultNamespace);

        dispatch({
          type: Type.RECEIVE_PODS,
          pods: podsList.items,
          resourceVersion: podsList.metadata?.resourceVersion,
        });
      } catch (e) {
        const errorMessage = 'Failed to fetch pods, reason: ' + helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_ERROR,
          error: errorMessage,
        });
        throw e;
      }
    },

  handleWebSocketMessage:
    (message: api.webSocket.NotificationMessage): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      if (api.webSocket.isStatusMessage(message)) {
        const { status } = message;

        const errorMessage = `WebSocket(POD): status code ${status.code}, reason: ${status.message}`;
        console.warn(errorMessage);

        if (status.code !== 200) {
          /* in case of error status trying to fetch all pods and re-subscribe to websocket channel */

          const websocketClient = container.get(WebsocketClient);

          websocketClient.unsubscribeFromChannel(api.webSocket.Channel.POD);

          await dispatch(actionCreators.requestPods());

          const defaultKubernetesNamespace = selectDefaultNamespace(getState());
          const namespace = defaultKubernetesNamespace.name;
          const getResourceVersion = () => {
            const state = getState();
            return selectPodsResourceVersion(state);
          };
          websocketClient.subscribeToChannel(
            api.webSocket.Channel.POD,
            namespace,
            getResourceVersion,
          );
        }
        return;
      }

      if (api.webSocket.isPodMessage(message)) {
        const { pod, eventPhase } = message;
        switch (eventPhase) {
          case api.webSocket.EventPhase.ADDED: {
            dispatch({
              type: Type.RECEIVE_POD,
              pod,
            });
            break;
          }
          case api.webSocket.EventPhase.MODIFIED: {
            dispatch({
              type: Type.MODIFY_POD,
              pod,
            });
            break;
          }
          case api.webSocket.EventPhase.DELETED: {
            dispatch({
              type: Type.DELETE_POD,
              pod,
            });
            break;
          }
          default:
            console.warn('WebSocket: unexpected eventPhase:', message);
        }
        return;
      }

      console.warn('WebSocket: unexpected message:', message);
    },
};

const unloadedState: State = {
  isLoading: false,
  pods: [],
  resourceVersion: '0',
};

export const reducer: Reducer<State> = (
  state: State | undefined,
  incomingAction: Action,
): State => {
  if (state === undefined) {
    return unloadedState;
  }

  const action = incomingAction as KnownAction;
  switch (action.type) {
    case Type.REQUEST_PODS:
      return createObject(state, {
        isLoading: true,
        error: undefined,
      });
    case Type.RECEIVE_PODS:
      return createObject(state, {
        isLoading: false,
        pods: action.pods,
        resourceVersion: getNewerResourceVersion(action.resourceVersion, state.resourceVersion),
      });
    case Type.RECEIVE_ERROR:
      return createObject(state, {
        isLoading: false,
        error: action.error,
      });
    case Type.RECEIVE_POD:
      return createObject(state, {
        pods: state.pods.concat([action.pod]),
        resourceVersion: getNewerResourceVersion(
          action.pod.metadata?.resourceVersion,
          state.resourceVersion,
        ),
      });
    case Type.MODIFY_POD:
      return createObject(state, {
        pods: state.pods.map(pod => (isSamePod(pod, action.pod) ? action.pod : pod)),
        resourceVersion: getNewerResourceVersion(
          action.pod.metadata?.resourceVersion,
          state.resourceVersion,
        ),
      });
    case Type.DELETE_POD:
      return createObject(state, {
        pods: state.pods.filter(pod => isSamePod(pod, action.pod) === false),
        resourceVersion: getNewerResourceVersion(
          action.pod.metadata?.resourceVersion,
          state.resourceVersion,
        ),
      });
    default:
      return state;
  }
};
