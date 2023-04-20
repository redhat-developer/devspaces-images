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
import { V1Status } from '@kubernetes/client-node';
import mockAxios, { AxiosError } from 'axios';
import { MockStoreEnhanced } from 'redux-mock-store';
import { ThunkDispatch } from 'redux-thunk';
import * as testStore from '..';
import { AppState } from '../..';
import { container } from '../../../inversify.config';
import { WebsocketClient } from '../../../services/dashboard-backend-client/websocketClient';
import { AUTHORIZED } from '../../sanityCheckMiddleware';
import { FakeStoreBuilder } from '../../__mocks__/storeBuilder';
import { event1, event2 } from './stubs';

describe('Events store, actions', () => {
  let appStore: MockStoreEnhanced<
    AppState,
    ThunkDispatch<AppState, undefined, testStore.KnownAction>
  >;

  beforeEach(() => {
    appStore = new FakeStoreBuilder().build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, testStore.KnownAction>
    >;
    container.snapshot();
  });

  afterEach(() => {
    jest.clearAllMocks();
    container.restore();
  });

  it('should create REQUEST_EVENTS and RECEIVE_EVENTS when fetching events', async () => {
    (mockAxios.get as jest.Mock).mockResolvedValueOnce({
      data: { items: [event1, event2], metadata: { resourceVersion: '123' } },
    });

    await appStore.dispatch(testStore.actionCreators.requestEvents());

    const actions = appStore.getActions();

    const expectedActions: testStore.KnownAction[] = [
      {
        type: testStore.Type.REQUEST_EVENTS,
        check: AUTHORIZED,
      },
      {
        type: testStore.Type.RECEIVE_EVENTS,
        events: [event1, event2],
        resourceVersion: '123',
      },
    ];

    expect(actions).toEqual(expectedActions);
  });

  it('should create REQUEST_EVENTS and RECEIVE_ERROR when fails to fetch events', async () => {
    (mockAxios.get as jest.Mock).mockRejectedValueOnce({
      isAxiosError: true,
      code: '500',
      message: 'Something unexpected happened.',
    } as AxiosError);

    try {
      await appStore.dispatch(testStore.actionCreators.requestEvents());
    } catch (e) {
      // noop
    }

    const actions = appStore.getActions();

    const expectedActions: testStore.KnownAction[] = [
      {
        type: testStore.Type.REQUEST_EVENTS,
        check: AUTHORIZED,
      },
      {
        type: testStore.Type.RECEIVE_ERROR,
        error: expect.stringContaining('Something unexpected happened.'),
      },
    ];

    expect(actions).toEqual(expectedActions);
  });

  describe('handle WebSocket events', () => {
    it('should create RECEIVE_EVENTS action when receiving a new event', async () => {
      await appStore.dispatch(
        testStore.actionCreators.handleWebSocketMessage({
          event: event1,
          eventPhase: api.webSocket.EventPhase.ADDED,
        }),
      );

      const actions = appStore.getActions();

      const expectedActions: testStore.KnownAction[] = [
        {
          type: testStore.Type.RECEIVE_EVENTS,
          events: [event1],
          resourceVersion: '1',
        },
      ];

      expect(actions).toEqual(expectedActions);
    });

    it('should create MODIFY_EVENT action when receiving a modified event', async () => {
      await appStore.dispatch(
        testStore.actionCreators.handleWebSocketMessage({
          event: event1,
          eventPhase: api.webSocket.EventPhase.MODIFIED,
        }),
      );

      const actions = appStore.getActions();

      const expectedActions: testStore.KnownAction[] = [
        {
          type: testStore.Type.MODIFY_EVENT,
          event: event1,
        },
      ];

      expect(actions).toEqual(expectedActions);
    });

    it('should create DELETE_EVENTS action when receiving a deleted event', async () => {
      await appStore.dispatch(
        testStore.actionCreators.handleWebSocketMessage({
          event: event1,
          eventPhase: api.webSocket.EventPhase.DELETED,
        }),
      );

      const actions = appStore.getActions();

      const expectedActions: testStore.KnownAction[] = [
        {
          type: testStore.Type.DELETE_EVENT,
          event: event1,
        },
      ];

      expect(actions).toEqual(expectedActions);
    });

    it('should create REQUEST_EVENTS and RECEIVE_EVENTS and resubscribe to channel', async () => {
      (mockAxios.get as jest.Mock).mockResolvedValueOnce({
        data: { items: [event1, event2], metadata: { resourceVersion: '123' } },
      });

      const websocketClient = container.get(WebsocketClient);
      const unsubscribeFromChannelSpy = jest
        .spyOn(websocketClient, 'unsubscribeFromChannel')
        .mockReturnValue(undefined);
      const subscribeToChannelSpy = jest
        .spyOn(websocketClient, 'subscribeToChannel')
        .mockReturnValue(undefined);

      const namespace = 'user-che';
      const appStoreWithNamespace = new FakeStoreBuilder()
        .withInfrastructureNamespace([{ name: namespace, attributes: { phase: 'Active' } }])
        .build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, testStore.KnownAction>
      >;
      await appStoreWithNamespace.dispatch(
        testStore.actionCreators.handleWebSocketMessage({
          status: {
            code: 410,
            message: 'The resourceVersion for the provided watch is too old.',
          } as V1Status,
          eventPhase: api.webSocket.EventPhase.ERROR,
          params: {
            namespace,
            resourceVersion: '123',
          },
        }),
      );

      const actions = appStoreWithNamespace.getActions();

      const expectedActions: testStore.KnownAction[] = [
        {
          check: AUTHORIZED,
          type: testStore.Type.REQUEST_EVENTS,
        },
        {
          type: testStore.Type.RECEIVE_EVENTS,
          events: [event1, event2],
          resourceVersion: '123',
        },
      ];

      expect(actions).toEqual(expectedActions);
      expect(unsubscribeFromChannelSpy).toHaveBeenCalledWith(api.webSocket.Channel.EVENT);
      expect(subscribeToChannelSpy).toHaveBeenCalledWith(api.webSocket.Channel.EVENT, namespace, {
        getResourceVersion: expect.any(Function),
      });
    });
  });
});
