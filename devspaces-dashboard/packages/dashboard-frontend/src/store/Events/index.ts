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
import { CoreV1Event } from '@kubernetes/client-node';
import { Action, Reducer } from 'redux';

import { container } from '@/inversify.config';
import { fetchEvents } from '@/services/backend-client/eventsApi';
import { WebsocketClient } from '@/services/backend-client/websocketClient';
import { getNewerResourceVersion } from '@/services/helpers/resourceVersion';
import { selectEventsResourceVersion } from '@/store/Events/selectors';
import { createObject } from '@/store/helpers';
import { selectDefaultNamespace } from '@/store/InfrastructureNamespaces/selectors';
import { AUTHORIZED, SanityCheckAction } from '@/store/sanityCheckMiddleware';

import { AppThunk } from '..';

export interface State {
  isLoading: boolean;
  events: CoreV1Event[];
  resourceVersion: string;
  error?: string;
}

export enum Type {
  REQUEST_EVENTS = 'REQUEST_EVENTS',
  RECEIVE_EVENTS = 'RECEIVE_EVENTS',
  MODIFY_EVENT = 'MODIFY_EVENT',
  DELETE_EVENT = 'DELETE_EVENT',
  RECEIVE_ERROR = 'RECEIVE_ERROR',
}

export interface RequestEventsAction extends Action, SanityCheckAction {
  type: Type.REQUEST_EVENTS;
}

export interface ReceiveEventsAction {
  type: Type.RECEIVE_EVENTS;
  events: CoreV1Event[];
  resourceVersion: string | undefined;
}

export interface ModifyEventAction {
  type: Type.MODIFY_EVENT;
  event: CoreV1Event;
}

export interface DeleteEventAction {
  type: Type.DELETE_EVENT;
  event: CoreV1Event;
}

export interface ReceiveErrorAction {
  type: Type.RECEIVE_ERROR;
  error: string;
}

export type KnownAction =
  | RequestEventsAction
  | ReceiveEventsAction
  | ModifyEventAction
  | DeleteEventAction
  | ReceiveErrorAction;

export type ActionCreators = {
  requestEvents: () => AppThunk<KnownAction, Promise<void>>;

  handleWebSocketMessage: (
    message: api.webSocket.NotificationMessage,
  ) => AppThunk<KnownAction, Promise<void>>;
};

export const actionCreators: ActionCreators = {
  requestEvents:
    (): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      await dispatch({
        type: Type.REQUEST_EVENTS,
        check: AUTHORIZED,
      });

      const defaultKubernetesNamespace = selectDefaultNamespace(getState());
      const defaultNamespace = defaultKubernetesNamespace.name;

      try {
        const eventsList = await fetchEvents(defaultNamespace);

        dispatch({
          type: Type.RECEIVE_EVENTS,
          events: eventsList.items,
          resourceVersion: eventsList.metadata?.resourceVersion,
        });
      } catch (e) {
        const errorMessage = 'Failed to fetch events, reason: ' + helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_ERROR,
          error: errorMessage,
        });
        throw errorMessage;
      }
    },

  handleWebSocketMessage:
    (message: api.webSocket.NotificationMessage): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      if (api.webSocket.isStatusMessage(message)) {
        const { status } = message;

        const errorMessage = `WebSocket(EVENT): status code ${status.code}, reason: ${status.message}`;
        console.debug(errorMessage);

        if (status.code !== 200) {
          /* in case of error status trying to fetch all events and re-subscribe to websocket channel */

          const websocketClient = container.get(WebsocketClient);

          websocketClient.unsubscribeFromChannel(api.webSocket.Channel.EVENT);

          await dispatch(actionCreators.requestEvents());

          const defaultKubernetesNamespace = selectDefaultNamespace(getState());
          const namespace = defaultKubernetesNamespace.name;
          const getResourceVersion = () => {
            const state = getState();
            return selectEventsResourceVersion(state);
          };
          websocketClient.subscribeToChannel(api.webSocket.Channel.EVENT, namespace, {
            getResourceVersion,
          });
        }
        return;
      }

      if (api.webSocket.isEventMessage(message)) {
        const { event, eventPhase } = message;
        switch (eventPhase) {
          case api.webSocket.EventPhase.ADDED:
            dispatch({
              type: Type.RECEIVE_EVENTS,
              events: [event],
              resourceVersion: event.metadata?.resourceVersion,
            });
            break;
          case api.webSocket.EventPhase.MODIFIED:
            dispatch({
              type: Type.MODIFY_EVENT,
              event,
            });
            break;
          case api.webSocket.EventPhase.DELETED:
            dispatch({
              type: Type.DELETE_EVENT,
              event,
            });
            break;
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
  events: [],
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
    case Type.REQUEST_EVENTS:
      return createObject<State>(state, {
        isLoading: true,
        error: undefined,
      });
    case Type.RECEIVE_EVENTS:
      return createObject<State>(state, {
        isLoading: false,
        events: state.events.concat(action.events),
        resourceVersion: getNewerResourceVersion(action.resourceVersion, state.resourceVersion),
      });
    case Type.MODIFY_EVENT:
      return createObject<State>(state, {
        events: state.events.map(event => {
          if (event.metadata.uid === action.event.metadata.uid) {
            return action.event;
          }
          return event;
        }),
        resourceVersion: getNewerResourceVersion(
          action.event.metadata.resourceVersion,
          state.resourceVersion,
        ),
      });
    case Type.DELETE_EVENT:
      return createObject<State>(state, {
        events: state.events.filter(event => event.metadata.uid !== action.event.metadata.uid),
        resourceVersion: getNewerResourceVersion(
          action.event.metadata.resourceVersion,
          state.resourceVersion,
        ),
      });
    case Type.RECEIVE_ERROR:
      return createObject<State>(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};
