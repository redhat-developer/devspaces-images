/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
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
import { ClusterConfig } from '@eclipse-che/common';
import { FakeStoreBuilder } from '../../__mocks__/storeBuilder';
import { AppState } from '../..';
import * as testStore from '..';

describe('clusterConfig store', () => {
  const clusterConfig: ClusterConfig = {
    dashboardWarning: 'Maintenance warning info',
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

    it('should create REQUEST_CLUSTER_CONFIG and RECEIVE_CLUSTER_CONFIG when fetching cluster config', async () => {
      (mockAxios.get as jest.Mock).mockResolvedValueOnce({
        data: clusterConfig,
      });

      await appStore.dispatch(testStore.actionCreators.requestClusterConfig());

      const actions = appStore.getActions();

      const expectedActions: testStore.KnownAction[] = [
        {
          type: testStore.Type.REQUEST_CLUSTER_CONFIG,
        },
        {
          type: testStore.Type.RECEIVE_CLUSTER_CONFIG,
          clusterConfig: clusterConfig,
        },
        {
          message: 'Maintenance warning info',
          type: 'ADD_BANNER',
        },
      ];

      expect(actions).toEqual(expectedActions);
    });

    it('should create REQUEST_CLUSTER_CONFIG and RECEIVE_CLUSTER_CONFIG_ERROR when fails to fetch cluster config', async () => {
      (mockAxios.get as jest.Mock).mockRejectedValueOnce({
        isAxiosError: true,
        code: '500',
        message: 'Something unexpected happened.',
      } as AxiosError);

      try {
        await appStore.dispatch(testStore.actionCreators.requestClusterConfig());
      } catch (e) {
        // noop
      }

      const actions = appStore.getActions();

      const expectedActions: testStore.KnownAction[] = [
        {
          type: testStore.Type.REQUEST_CLUSTER_CONFIG,
        },
        {
          type: testStore.Type.RECEIVE_CLUSTER_CONFIG_ERROR,
          error: expect.stringContaining('Something unexpected happened.'),
        },
      ];

      expect(actions).toEqual(expectedActions);
    });
  });

  describe('reducers', () => {
    it('should return initial state', () => {
      const incomingAction: testStore.RequestClusterConfigAction = {
        type: testStore.Type.REQUEST_CLUSTER_CONFIG,
      };
      const initialState = testStore.reducer(undefined, incomingAction);

      const expectedState: testStore.State = {
        isLoading: false,
        clusterConfig: {},
      };

      expect(initialState).toEqual(expectedState);
    });

    it('should return state if action type is not matched', () => {
      const initialState: testStore.State = {
        isLoading: true,
        clusterConfig: {},
      };
      const incomingAction = {
        type: 'OTHER_ACTION',
      } as AnyAction;
      const newState = testStore.reducer(initialState, incomingAction);

      const expectedState: testStore.State = {
        isLoading: true,
        clusterConfig: {},
      };
      expect(newState).toEqual(expectedState);
    });

    it('should handle REQUEST_CLUSTER_CONFIG', () => {
      const initialState: testStore.State = {
        isLoading: false,
        clusterConfig: {},
        error: 'unexpected error',
      };
      const incomingAction: testStore.RequestClusterConfigAction = {
        type: testStore.Type.REQUEST_CLUSTER_CONFIG,
      };

      const newState = testStore.reducer(initialState, incomingAction);

      const expectedState: testStore.State = {
        isLoading: true,
        clusterConfig: {},
      };

      expect(newState).toEqual(expectedState);
    });

    it('should handle RECEIVE_CLUSTER_INFO', () => {
      const initialState: testStore.State = {
        isLoading: true,
        clusterConfig: {},
      };
      const incomingAction: testStore.ReceiveClusterConfigAction = {
        type: testStore.Type.RECEIVE_CLUSTER_CONFIG,
        clusterConfig,
      };

      const newState = testStore.reducer(initialState, incomingAction);

      const expectedState: testStore.State = {
        isLoading: false,
        clusterConfig: {
          dashboardWarning: 'Maintenance warning info',
        },
      };

      expect(newState).toEqual(expectedState);
    });

    it('should handle RECEIVE_CLUSTER_CONFIG_ERROR', () => {
      const initialState: testStore.State = {
        isLoading: true,
        clusterConfig: {},
      };
      const incomingAction: testStore.ReceivedClusterConfigErrorAction = {
        type: testStore.Type.RECEIVE_CLUSTER_CONFIG_ERROR,
        error: 'unexpected error',
      };

      const newState = testStore.reducer(initialState, incomingAction);

      const expectedState: testStore.State = {
        isLoading: false,
        clusterConfig: {},
        error: 'unexpected error',
      };

      expect(newState).toEqual(expectedState);
    });
  });
});
