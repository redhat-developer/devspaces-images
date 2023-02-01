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

import mockAxios from 'axios';
import { MockStoreEnhanced } from 'redux-mock-store';
import { ThunkDispatch } from 'redux-thunk';
import { FakeStoreBuilder } from '../../__mocks__/storeBuilder';
import * as dwDockerConfigStore from '..';
import { AppState } from '../..';
import { AnyAction } from 'redux';
import { AUTHORIZED } from '../../sanityCheckMiddleware';

// mute the outputs
console.error = jest.fn();

describe('dwDockerConfig store', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('actions', () => {
    it('should create REQUEST_DEVWORKSPACE_CREDENTIALS and SET_DEVWORKSPACE_CREDENTIALS when requestCredentials', async () => {
      (mockAxios.get as jest.Mock).mockResolvedValueOnce({
        data: {
          resourceVersion: '45654',
          dockerconfig:
            'eyJhdXRocyI6eyJkdW1teS5pbyI6eyJhdXRoIjoiZEdWemRHNWhiV1U2V0ZoWVdGaFlXRmhZV0ZoWVdGaFkifX19',
        },
      });

      const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, dwDockerConfigStore.KnownAction>
      >;

      await store.dispatch(dwDockerConfigStore.actionCreators.requestCredentials());

      const actions = store.getActions();

      const expectedActions: dwDockerConfigStore.KnownAction[] = [
        {
          type: 'REQUEST_DEVWORKSPACE_CREDENTIALS',
          check: AUTHORIZED,
        },
        {
          type: 'SET_DEVWORKSPACE_CREDENTIALS',
          registries: [
            {
              password: 'XXXXXXXXXXXXXXX',
              url: 'dummy.io',
              username: 'testname',
            },
          ],
          resourceVersion: '45654',
        },
      ];

      expect(actions).toEqual(expectedActions);
    });

    it('should create REQUEST_DEVWORKSPACE_CREDENTIALS and SET_DEVWORKSPACE_CREDENTIALS when updateCredentials', async () => {
      (mockAxios.put as jest.Mock).mockResolvedValueOnce({
        data: {
          resourceVersion: '12345',
        },
      });

      const store = new FakeStoreBuilder().build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, dwDockerConfigStore.KnownAction>
      >;

      await store.dispatch(
        dwDockerConfigStore.actionCreators.updateCredentials([
          {
            password: 'YYYYYYYYYYYY',
            url: 'dummy.io',
            username: 'testname2',
          },
        ]),
      );

      const actions = store.getActions();

      const expectedActions: dwDockerConfigStore.KnownAction[] = [
        {
          type: 'REQUEST_DEVWORKSPACE_CREDENTIALS',
          check: AUTHORIZED,
        },
        {
          type: 'SET_DEVWORKSPACE_CREDENTIALS',
          registries: [
            {
              password: 'YYYYYYYYYYYY',
              url: 'dummy.io',
              username: 'testname2',
            },
          ],
          resourceVersion: '12345',
        },
      ];

      expect(actions).toEqual(expectedActions);
    });

    describe('reducers', () => {
      it('should return initial state', () => {
        const incomingAction: dwDockerConfigStore.RequestCredentialsAction = {
          type: 'REQUEST_DEVWORKSPACE_CREDENTIALS',
          check: AUTHORIZED,
        };
        const initialState = dwDockerConfigStore.reducer(undefined, incomingAction);

        const expectedState: dwDockerConfigStore.State = {
          isLoading: false,
          registries: [],
          resourceVersion: undefined,
          error: undefined,
        };

        expect(initialState).toEqual(expectedState);
      });

      it('should return state if action type is not matched', () => {
        const initialState: dwDockerConfigStore.State = {
          isLoading: false,
          registries: [
            {
              password: 'YYYYYYYYYYYY',
              url: 'dummy.io',
              username: 'testname3',
            },
          ],
          resourceVersion: '123',
          error: undefined,
        } as dwDockerConfigStore.State;
        const incomingAction = {
          type: 'OTHER_ACTION',
          isLoading: true,
          registries: [],
          resourceVersion: undefined,
        } as AnyAction;
        const newState = dwDockerConfigStore.reducer(initialState, incomingAction);

        const expectedState: dwDockerConfigStore.State = {
          isLoading: false,
          registries: [
            {
              password: 'YYYYYYYYYYYY',
              url: 'dummy.io',
              username: 'testname3',
            },
          ],
          resourceVersion: '123',
          error: undefined,
        };
        expect(newState).toEqual(expectedState);
      });

      it('should handle REQUEST_DEVWORKSPACE_CREDENTIALS', () => {
        const initialState: dwDockerConfigStore.State = {
          isLoading: false,
          registries: [
            {
              password: '********',
              url: 'dummy.io',
              username: 'testname4',
            },
          ],
          resourceVersion: '123',
          error: undefined,
        };
        const incomingAction: dwDockerConfigStore.RequestCredentialsAction = {
          type: 'REQUEST_DEVWORKSPACE_CREDENTIALS',
          check: AUTHORIZED,
        };

        const newState = dwDockerConfigStore.reducer(initialState, incomingAction);

        const expectedState: dwDockerConfigStore.State = {
          isLoading: true,
          registries: [
            {
              password: '********',
              url: 'dummy.io',
              username: 'testname4',
            },
          ],
          resourceVersion: '123',
          error: undefined,
        };

        expect(newState).toEqual(expectedState);
      });

      it('should handle SET_DEVWORKSPACE_CREDENTIALS', () => {
        const initialState: dwDockerConfigStore.State = {
          isLoading: true,
          registries: [
            {
              password: '********',
              url: 'dummy.io',
              username: 'testname4',
            },
          ],
          resourceVersion: '123',
          error: undefined,
        };
        const incomingAction: dwDockerConfigStore.SetCredentialsAction = {
          type: 'SET_DEVWORKSPACE_CREDENTIALS',
          registries: [],
          resourceVersion: '345',
        };

        const newState = dwDockerConfigStore.reducer(initialState, incomingAction);

        const expectedState: dwDockerConfigStore.State = {
          isLoading: false,
          registries: [],
          resourceVersion: '345',
          error: undefined,
        };

        expect(newState).toEqual(expectedState);
      });

      it('should handle RECEIVE_DEVWORKSPACE_CREDENTIALS_ERROR', () => {
        const initialState: dwDockerConfigStore.State = {
          isLoading: true,
          registries: [],
          resourceVersion: undefined,
          error: undefined,
        };
        const incomingAction: dwDockerConfigStore.ReceiveErrorAction = {
          type: 'RECEIVE_DEVWORKSPACE_CREDENTIALS_ERROR',
          error: 'unexpected error',
        };

        const newState = dwDockerConfigStore.reducer(initialState, incomingAction);

        const expectedState: dwDockerConfigStore.State = {
          isLoading: false,
          registries: [],
          resourceVersion: undefined,
          error: 'unexpected error',
        };

        expect(newState).toEqual(expectedState);
      });
    });
  });
});
