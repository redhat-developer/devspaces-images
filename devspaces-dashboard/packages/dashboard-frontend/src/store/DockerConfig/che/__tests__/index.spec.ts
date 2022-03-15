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

import { MockStoreEnhanced } from 'redux-mock-store';
import { ThunkDispatch } from 'redux-thunk';
import { FakeStoreBuilder } from '../../../__mocks__/storeBuilder';
import * as cheDockerConfigStore from '..';
import { AppState } from '../../..';
import { AnyAction } from 'redux';

jest.mock('../../../UserPreferences', () => {
  return {
    actionCreators: {
      requestUserPreferences: () => (): Promise<void> => Promise.resolve(),
      replaceUserPreferences: () => (): Promise<void> => Promise.resolve(),
    },
  };
});

// mute the outputs
console.error = jest.fn();

describe('cheDockerConfig store', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('actions', () => {
    it('should create REQUEST_CHEWORKSPACE_CREDENTIALS and SET_CHEWORKSPACE_CREDENTIALS when requestCredentials', async () => {
      const store = new FakeStoreBuilder()
        .withUserPreferences({
          dockerCredentials:
            'eyJkdW1teS5pbyI6eyJwYXNzd29yZCI6IlhYWFhYWFhYWFhYWFhYWCIsInVzZXJuYW1lIjoidGVzdG5hbWUifX0=',
        })
        .build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, cheDockerConfigStore.KnownAction>
      >;

      await store.dispatch(cheDockerConfigStore.actionCreators.requestCredentials());

      const actions = store.getActions();

      const expectedActions: cheDockerConfigStore.KnownAction[] = [
        {
          type: 'REQUEST_CHEWORKSPACE_CREDENTIALS',
        },
        {
          type: 'SET_CHEWORKSPACE_CREDENTIALS',
          registries: [
            {
              password: 'XXXXXXXXXXXXXXX',
              url: 'dummy.io',
              username: 'testname',
            },
          ],
        },
      ];

      expect(actions).toEqual(expectedActions);
    });

    it('should create REQUEST_CHEWORKSPACE_CREDENTIALS and SET_CHEWORKSPACE_CREDENTIALS when updateCredentials', async () => {
      const store = new FakeStoreBuilder()
        .withUserPreferences({
          dockerCredentials:
            'eyJkdW1teS5pbyI6eyJwYXNzd29yZCI6IlhYWFhYWFhYWFhYWFhYWCIsInVzZXJuYW1lIjoidGVzdG5hbWUifX0=',
        })
        .build() as MockStoreEnhanced<
        AppState,
        ThunkDispatch<AppState, undefined, cheDockerConfigStore.KnownAction>
      >;

      await store.dispatch(
        cheDockerConfigStore.actionCreators.updateCredentials([
          {
            password: 'YYYYYYYYYYYY',
            url: 'dummy.io',
            username: 'testname2',
          },
        ]),
      );

      const actions = store.getActions();

      const expectedActions: cheDockerConfigStore.KnownAction[] = [
        {
          type: 'REQUEST_CHEWORKSPACE_CREDENTIALS',
        },
        {
          type: 'SET_CHEWORKSPACE_CREDENTIALS',
          registries: [
            {
              password: 'YYYYYYYYYYYY',
              url: 'dummy.io',
              username: 'testname2',
            },
          ],
        },
      ];

      expect(actions).toEqual(expectedActions);
    });

    describe('reducers', () => {
      it('should return initial state', () => {
        const incomingAction: cheDockerConfigStore.RequestCredentialsAction = {
          type: 'REQUEST_CHEWORKSPACE_CREDENTIALS',
        };
        const initialState = cheDockerConfigStore.reducer(undefined, incomingAction);

        const expectedState: cheDockerConfigStore.State = {
          isLoading: false,
          registries: [],
          error: undefined,
        };

        expect(initialState).toEqual(expectedState);
      });

      it('should return state if action type is not matched', () => {
        const initialState: cheDockerConfigStore.State = {
          isLoading: false,
          registries: [
            {
              password: 'YYYYYYYYYYYY',
              url: 'dummy.io',
              username: 'testname3',
            },
          ],
          error: undefined,
        } as cheDockerConfigStore.State;
        const incomingAction = {
          type: 'OTHER_ACTION',
          isLoading: true,
          registries: [],
        } as AnyAction;
        const newState = cheDockerConfigStore.reducer(initialState, incomingAction);

        const expectedState: cheDockerConfigStore.State = {
          isLoading: false,
          registries: [
            {
              password: 'YYYYYYYYYYYY',
              url: 'dummy.io',
              username: 'testname3',
            },
          ],
          error: undefined,
        };
        expect(newState).toEqual(expectedState);
      });

      it('should handle REQUEST_CHEWORKSPACE_CREDENTIALS', () => {
        const initialState: cheDockerConfigStore.State = {
          isLoading: false,
          registries: [
            {
              password: '********',
              url: 'dummy.io',
              username: 'testname4',
            },
          ],
          error: undefined,
        };
        const incomingAction: cheDockerConfigStore.RequestCredentialsAction = {
          type: 'REQUEST_CHEWORKSPACE_CREDENTIALS',
        };

        const newState = cheDockerConfigStore.reducer(initialState, incomingAction);

        const expectedState: cheDockerConfigStore.State = {
          isLoading: true,
          registries: [
            {
              password: '********',
              url: 'dummy.io',
              username: 'testname4',
            },
          ],
          error: undefined,
        };

        expect(newState).toEqual(expectedState);
      });

      it('should handle SET_CHEWORKSPACE_CREDENTIALS', () => {
        const initialState: cheDockerConfigStore.State = {
          isLoading: true,
          registries: [
            {
              password: '********',
              url: 'dummy.io',
              username: 'testname4',
            },
          ],
          error: undefined,
        };
        const incomingAction: cheDockerConfigStore.SetCredentialsAction = {
          type: 'SET_CHEWORKSPACE_CREDENTIALS',
          registries: [],
        };

        const newState = cheDockerConfigStore.reducer(initialState, incomingAction);

        const expectedState: cheDockerConfigStore.State = {
          isLoading: false,
          registries: [],
          error: undefined,
        };

        expect(newState).toEqual(expectedState);
      });

      it('should handle RECEIVE_CHEWORKSPACE_CREDENTIALS_ERROR', () => {
        const initialState: cheDockerConfigStore.State = {
          isLoading: true,
          registries: [],
          resourceVersion: undefined,
          error: undefined,
        };
        const incomingAction: cheDockerConfigStore.ReceiveErrorAction = {
          type: 'RECEIVE_CHEWORKSPACE_CREDENTIALS_ERROR',
          error: 'unexpected error',
        };

        const newState = cheDockerConfigStore.reducer(initialState, incomingAction);

        const expectedState: cheDockerConfigStore.State = {
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
