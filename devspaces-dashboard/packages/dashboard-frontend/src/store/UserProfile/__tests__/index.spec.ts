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
import mockAxios, { AxiosError } from 'axios';
import { AnyAction } from 'redux';
import { MockStoreEnhanced } from 'redux-mock-store';
import { ThunkDispatch } from 'redux-thunk';
import * as testStore from '..';
import { AppState } from '../..';
import { AUTHORIZED } from '../../sanityCheckMiddleware';
import { FakeStoreBuilder } from '../../__mocks__/storeBuilder';

const namespace = 'user1-che';

describe('UserPreferences store', () => {
  let userProfile: api.IUserProfile;

  beforeEach(() => {
    userProfile = {
      email: 'user1@che',
      username: 'user1',
    };
  });

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

    it('should create REQUEST_USER_PROFILE and RECEIVE_USER_PROFILE when fetching user profile', async () => {
      (mockAxios.get as jest.Mock).mockResolvedValueOnce({
        data: userProfile,
      });

      await appStore.dispatch(testStore.actionCreators.requestUserProfile(namespace));

      const actions = appStore.getActions();
      const expectedActions: testStore.KnownAction[] = [
        {
          type: testStore.Type.REQUEST_USER_PROFILE,
          check: AUTHORIZED,
        },
        {
          type: testStore.Type.RECEIVE_USER_PROFILE,
          userProfile,
        },
      ];

      expect(actions).toEqual(expectedActions);
    });

    it('should create REQUEST_USER_PROFILE and RECEIVE_USER_PROFILE_ERROR when fails to fetch user profile', async () => {
      (mockAxios.get as jest.Mock).mockRejectedValueOnce({
        isAxiosError: true,
        code: '500',
        message: 'Something unexpected happened.',
      } as AxiosError);

      try {
        await appStore.dispatch(testStore.actionCreators.requestUserProfile(namespace));
      } catch (e) {
        // noop
      }

      const actions = appStore.getActions();
      const expectedActions: testStore.KnownAction[] = [
        {
          type: testStore.Type.REQUEST_USER_PROFILE,
          check: AUTHORIZED,
        },
        {
          type: testStore.Type.RECEIVE_USER_PROFILE_ERROR,
          error: expect.stringContaining('Something unexpected happened.'),
        },
      ];

      expect(actions).toEqual(expectedActions);
    });
  });

  describe('reducers', () => {
    it('should return initial state', () => {
      const incomingAction: testStore.RequestUserProfileAction = {
        type: testStore.Type.REQUEST_USER_PROFILE,
        check: AUTHORIZED,
      };
      const initialState = testStore.reducer(undefined, incomingAction);

      const expectedState: testStore.State = {
        isLoading: false,
        userProfile: {
          email: '',
          username: 'unknown',
        },
      };

      expect(initialState).toEqual(expectedState);
    });

    it('should return state if action type is not matched', () => {
      const initialState: testStore.State = {
        isLoading: true,
        userProfile: {
          email: '',
          username: 'unknown',
        },
      };
      const incomingAction = {
        type: 'OTHER_ACTION',
      } as AnyAction;
      const newState = testStore.reducer(initialState, incomingAction);

      const expectedState: testStore.State = {
        isLoading: true,
        userProfile: {
          email: '',
          username: 'unknown',
        },
      };
      expect(newState).toEqual(expectedState);
    });

    it('should handle REQUEST_USER_PROFILE', () => {
      const initialState: testStore.State = {
        isLoading: false,
        userProfile: {
          email: '',
          username: 'unknown',
        },
        error: 'unexpected error',
      };
      const incomingAction: testStore.RequestUserProfileAction = {
        type: testStore.Type.REQUEST_USER_PROFILE,
        check: AUTHORIZED,
      };

      const newState = testStore.reducer(initialState, incomingAction);

      const expectedState: testStore.State = {
        isLoading: true,
        userProfile: {
          email: '',
          username: 'unknown',
        },
      };

      expect(newState).toEqual(expectedState);
    });

    it('should handle RECEIVE_USER_PROFILE', () => {
      const initialState: testStore.State = {
        isLoading: true,
        userProfile: {
          email: '',
          username: 'unknown',
        },
      };
      const incomingAction: testStore.ReceiveUserProfileAction = {
        type: testStore.Type.RECEIVE_USER_PROFILE,
        userProfile,
      };

      const newState = testStore.reducer(initialState, incomingAction);

      const expectedState: testStore.State = {
        isLoading: false,
        userProfile,
      };

      expect(newState).toEqual(expectedState);
    });

    it('should handle RECEIVE_USER_PROFILE_ERROR', () => {
      const initialState: testStore.State = {
        isLoading: true,
        userProfile: {
          email: '',
          username: 'unknown',
        },
      };
      const incomingAction: testStore.ReceiveUserProfileErrorAction = {
        type: testStore.Type.RECEIVE_USER_PROFILE_ERROR,
        error: 'unexpected error',
      };

      const newState = testStore.reducer(initialState, incomingAction);

      const expectedState: testStore.State = {
        isLoading: false,
        userProfile: {
          email: '',
          username: 'unknown',
        },
        error: 'unexpected error',
      };

      expect(newState).toEqual(expectedState);
    });
  });
});
