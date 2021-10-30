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
import { FakeStoreBuilder } from '../../__mocks__/storeBuilder';
import { AppState } from '../..';
import * as testStore from '..';
import { ApplicationInfo } from '@eclipse-che/common';

describe('externalApplications store', () => {

  const clusterInfo: ApplicationInfo = {
    url: 'web/console/url',
    title: 'Web Console',
    icon: 'web/console/icon.png',
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('actions', () => {

    let appStore: MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, testStore.KnownAction>>;

    beforeEach(() => {
      appStore = new FakeStoreBuilder().build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, testStore.KnownAction>>;
    });

    it('should create REQUEST_APP_INFO and RECEIVE_APP_INFO when fetching cluster info', async () => {
      (mockAxios.get as jest.Mock).mockResolvedValueOnce({
        data: clusterInfo,
      });

      await appStore.dispatch(testStore.actionCreators.requestClusterInfo());

      const actions = appStore.getActions();

      const expectedActions: testStore.KnownAction[] = [{
        type: testStore.Type.REQUEST_APP_INFO,
      }, {
        type: testStore.Type.RECEIVE_APP_INFO,
        appInfo: clusterInfo,
      }];

      expect(actions).toEqual(expectedActions);
    });

    it('should create REQUEST_APP_INFO and RECEIVE_APP_INFO_ERROR when fails to fetch cluster info', async () => {
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

      const expectedActions: testStore.KnownAction[] = [{
        type: testStore.Type.REQUEST_APP_INFO,
      }, {
        type: testStore.Type.RECEIVE_APP_INFO_ERROR,
        error: expect.stringContaining('Something unexpected happened.'),
      }];

      expect(actions).toEqual(expectedActions);
    });

  });

  describe('reducers', () => {

    it('should return initial state', () => {
      const incomingAction: testStore.RequestAppInfoAction = {
        type: testStore.Type.REQUEST_APP_INFO,
      };
      const initialState = testStore.reducer(undefined, incomingAction);

      const expectedState: testStore.State = {
        isLoading: false,
        applications: [],
      };

      expect(initialState).toEqual(expectedState);
    });

    it('should return state if action type is not matched', () => {
      const initialState: testStore.State = {
        isLoading: true,
        applications: [],
      };
      const incomingAction = {
        type: 'OTHER_ACTION',
      } as AnyAction;
      const newState = testStore.reducer(initialState, incomingAction);

      const expectedState: testStore.State = {
        isLoading: true,
        applications: [],
      };
      expect(newState).toEqual(expectedState);

    });

    it('should handle REQUEST_APP_INFO', () => {
      const initialState: testStore.State = {
        isLoading: false,
        applications: [],
        error: 'unexpected error',
      };
      const incomingAction: testStore.RequestAppInfoAction = {
        type: testStore.Type.REQUEST_APP_INFO,
      };

      const newState = testStore.reducer(initialState, incomingAction);

      const expectedState: testStore.State = {
        isLoading: true,
        applications: [],
      };

      expect(newState).toEqual(expectedState);
    });

    it('should handle RECEIVE_APP_INFO', () => {
      const initialState: testStore.State = {
        isLoading: true,
        applications: [],
      };
      const incomingAction: testStore.ReceiveAppInfoAction = {
        type: testStore.Type.RECEIVE_APP_INFO,
        appInfo: clusterInfo,
      };

      const newState = testStore.reducer(initialState, incomingAction);

      const expectedState: testStore.State = {
        isLoading: false,
        applications: [{
          url: 'web/console/url',
          title: 'Web Console',
          icon: 'web/console/icon.png',
        }],
      };

      expect(newState).toEqual(expectedState);
    });

    it('should handle RECEIVE_APP_INFO_ERROR', () => {
      const initialState: testStore.State = {
        isLoading: true,
        applications: [],
      };
      const incomingAction: testStore.ReceivedAppInfoErrorAction = {
        type: testStore.Type.RECEIVE_APP_INFO_ERROR,
        error: 'unexpected error',
      };

      const newState = testStore.reducer(initialState, incomingAction);

      const expectedState: testStore.State = {
        isLoading: false,
        applications: [],
        error: 'unexpected error',
      };

      expect(newState).toEqual(expectedState);
    });

  });

});
