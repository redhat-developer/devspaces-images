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

import mockAxios, { AxiosError } from 'axios';
import { MockStoreEnhanced } from 'redux-mock-store';
import { AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { ApplicationId, ClusterInfo } from '@eclipse-che/common';
import { FakeStoreBuilder } from '../../__mocks__/storeBuilder';
import { AppState } from '../..';
import * as testStore from '..';
import { AUTHORIZED } from '../../sanityCheckMiddleware';

describe('clusterInfo store', () => {
  const clusterInfo: ClusterInfo = {
    applications: [
      {
        id: ApplicationId.CLUSTER_CONSOLE,
        url: 'web/console/url',
        title: 'Web Console',
        icon: 'web/console/icon.png',
      },
    ],
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('actions', () => {
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

    it('should create REQUEST_CLUSTER_INFO and RECEIVE_CLUSTER_INFO when fetching cluster info', async () => {
      (mockAxios.get as jest.Mock).mockResolvedValueOnce({
        data: clusterInfo,
      });

      await appStore.dispatch(testStore.actionCreators.requestClusterInfo());

      const actions = appStore.getActions();

      const expectedActions: testStore.KnownAction[] = [
        {
          type: testStore.Type.REQUEST_CLUSTER_INFO,
          check: AUTHORIZED,
        },
        {
          type: testStore.Type.RECEIVE_CLUSTER_INFO,
          clusterInfo: clusterInfo,
        },
      ];

      expect(actions).toEqual(expectedActions);
    });

    it('should create REQUEST_CLUSTER_INFO and RECEIVE_CLUSTER_INFO_ERROR when fails to fetch cluster info', async () => {
      (mockAxios.get as jest.Mock).mockRejectedValueOnce({
        isAxiosError: true,
        code: '500',
        message: 'Something unexpected happened.',
      } as AxiosError);

      try {
        await appStore.dispatch(testStore.actionCreators.requestClusterInfo());
      } catch (e) {
        // noop
      }

      const actions = appStore.getActions();

      const expectedActions: testStore.KnownAction[] = [
        {
          type: testStore.Type.REQUEST_CLUSTER_INFO,
          check: AUTHORIZED,
        },
        {
          type: testStore.Type.RECEIVE_CLUSTER_INFO_ERROR,
          error: expect.stringContaining('Something unexpected happened.'),
        },
      ];

      expect(actions).toEqual(expectedActions);
    });
  });

  describe('reducers', () => {
    it('should return initial state', () => {
      const incomingAction: testStore.RequestClusterInfoAction = {
        type: testStore.Type.REQUEST_CLUSTER_INFO,
        check: AUTHORIZED,
      };
      const initialState = testStore.reducer(undefined, incomingAction);

      const expectedState: testStore.State = {
        isLoading: false,
        clusterInfo: {
          applications: [],
        },
      };

      expect(initialState).toEqual(expectedState);
    });

    it('should return state if action type is not matched', () => {
      const initialState: testStore.State = {
        isLoading: true,
        clusterInfo: {
          applications: [],
        },
      };
      const incomingAction = {
        type: 'OTHER_ACTION',
      } as AnyAction;
      const newState = testStore.reducer(initialState, incomingAction);

      const expectedState: testStore.State = {
        isLoading: true,
        clusterInfo: {
          applications: [],
        },
      };
      expect(newState).toEqual(expectedState);
    });

    it('should handle REQUEST_CLUSTER_INFO', () => {
      const initialState: testStore.State = {
        isLoading: false,
        clusterInfo: {
          applications: [],
        },
        error: 'unexpected error',
      };
      const incomingAction: testStore.RequestClusterInfoAction = {
        type: testStore.Type.REQUEST_CLUSTER_INFO,
        check: AUTHORIZED,
      };

      const newState = testStore.reducer(initialState, incomingAction);

      const expectedState: testStore.State = {
        isLoading: true,
        clusterInfo: {
          applications: [],
        },
      };

      expect(newState).toEqual(expectedState);
    });

    it('should handle RECEIVE_CLUSTER_INFO', () => {
      const initialState: testStore.State = {
        isLoading: true,
        clusterInfo: {
          applications: [],
        },
      };
      const incomingAction: testStore.ReceiveClusterInfoAction = {
        type: testStore.Type.RECEIVE_CLUSTER_INFO,
        clusterInfo,
      };

      const newState = testStore.reducer(initialState, incomingAction);

      const expectedState: testStore.State = {
        isLoading: false,
        clusterInfo: {
          applications: [
            {
              id: ApplicationId.CLUSTER_CONSOLE,
              url: 'web/console/url',
              title: 'Web Console',
              icon: 'web/console/icon.png',
            },
          ],
        },
      };

      expect(newState).toEqual(expectedState);
    });

    it('should handle RECEIVE_CLUSTER_INFO_ERROR', () => {
      const initialState: testStore.State = {
        isLoading: true,
        clusterInfo: {
          applications: [],
        },
      };
      const incomingAction: testStore.ReceivedClusterInfoErrorAction = {
        type: testStore.Type.RECEIVE_CLUSTER_INFO_ERROR,
        error: 'unexpected error',
      };

      const newState = testStore.reducer(initialState, incomingAction);

      const expectedState: testStore.State = {
        isLoading: false,
        clusterInfo: {
          applications: [],
        },
        error: 'unexpected error',
      };

      expect(newState).toEqual(expectedState);
    });
  });
});
