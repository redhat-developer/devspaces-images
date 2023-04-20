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
import { pod1, pod2 } from './stub';

describe('Pods store, actions', () => {
  let appStore: MockStoreEnhanced<
    AppState,
    ThunkDispatch<AppState, undefined, testStore.KnownAction>
  >;

  beforeEach(() => {
    appStore = new FakeStoreBuilder().build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, testStore.KnownAction>
    >;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create REQUEST_PODS and RECEIVE_PODS when fetching pods', async () => {
    (mockAxios.get as jest.Mock).mockResolvedValueOnce({
      data: { items: [pod1, pod2], metadata: { resourceVersion: '123' } },
    });

    await appStore.dispatch(testStore.actionCreators.requestPods());

    const actions = appStore.getActions();

    const expectedActions: testStore.KnownAction[] = [
      {
        type: testStore.Type.REQUEST_PODS,
        check: AUTHORIZED,
      },
      {
        type: testStore.Type.RECEIVE_PODS,
        pods: [pod1, pod2],
        resourceVersion: '123',
      },
    ];

    expect(actions).toEqual(expectedActions);
  });

  it('should create REQUEST_PODS and RECEIVE_ERROR when fails to fetch pods', async () => {
    (mockAxios.get as jest.Mock).mockRejectedValueOnce({
      isAxiosError: true,
      code: '500',
      message: 'Something unexpected happened.',
    } as AxiosError);

    try {
      await appStore.dispatch(testStore.actionCreators.requestPods());
    } catch (e) {
      // noop
    }

    const actions = appStore.getActions();

    const expectedActions: testStore.KnownAction[] = [
      {
        type: testStore.Type.REQUEST_PODS,
        check: AUTHORIZED,
      },
      {
        type: testStore.Type.RECEIVE_ERROR,
        error: expect.stringContaining('Something unexpected happened.'),
      },
    ];

    expect(actions).toEqual(expectedActions);
  });

  describe('handle WebSocket messages', () => {
    it('should create RECEIVE_POD in case of ADDED event phase', () => {
      appStore.dispatch(
        testStore.actionCreators.handleWebSocketMessage({
          pod: pod1,
          eventPhase: api.webSocket.EventPhase.ADDED,
        }),
      );

      const actions = appStore.getActions();

      const expectedActions: testStore.KnownAction[] = [
        {
          type: testStore.Type.RECEIVE_POD,
          pod: pod1,
        },
      ];

      expect(actions).toEqual(expectedActions);
    });

    it('should create MODIFY_POD in case of MODIFIED event phase', () => {
      appStore.dispatch(
        testStore.actionCreators.handleWebSocketMessage({
          pod: pod1,
          eventPhase: api.webSocket.EventPhase.MODIFIED,
        }),
      );

      const actions = appStore.getActions();

      const expectedActions: testStore.KnownAction[] = [
        {
          type: testStore.Type.MODIFY_POD,
          pod: pod1,
        },
      ];

      expect(actions).toEqual(expectedActions);
    });

    it('should create DELETE_POD and DELETE_EVENTS in case of DELETED event phase', () => {
      appStore.dispatch(
        testStore.actionCreators.handleWebSocketMessage({
          pod: pod1,
          eventPhase: api.webSocket.EventPhase.DELETED,
        }),
      );

      const actions = appStore.getActions();

      const expectedActions: testStore.KnownAction[] = [
        {
          type: testStore.Type.DELETE_POD,
          pod: pod1,
        },
      ];

      expect(actions).toEqual(expectedActions);
    });

    it('should create REQUEST_PODS and RECEIVE_PODS and resubscribe to channel', async () => {
      (mockAxios.get as jest.Mock).mockResolvedValueOnce({
        data: { items: [pod1, pod2], metadata: { resourceVersion: '123' } },
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
          type: testStore.Type.REQUEST_PODS,
        },
        {
          type: testStore.Type.RECEIVE_PODS,
          pods: [pod1, pod2],
          resourceVersion: '123',
        },
      ];

      expect(actions).toEqual(expectedActions);
      expect(unsubscribeFromChannelSpy).toHaveBeenCalledWith(api.webSocket.Channel.POD);
      expect(subscribeToChannelSpy).toHaveBeenCalledWith(api.webSocket.Channel.POD, namespace, {
        getResourceVersion: expect.any(Function),
      });
    });
  });
});
