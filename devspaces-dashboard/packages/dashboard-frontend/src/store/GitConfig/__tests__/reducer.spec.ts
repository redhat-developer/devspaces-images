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

import { AnyAction } from 'redux';

import * as unloadedState from '@/store/GitConfig/reducer';
import { AUTHORIZED } from '@/store/sanityCheckMiddleware';

import * as TestStore from '..';

describe('GitConfig store, reducer', () => {
  it('should return initial state', () => {
    const incomingAction: TestStore.RequestGitConfigAction = {
      type: TestStore.Type.REQUEST_GITCONFIG,
      check: AUTHORIZED,
    };
    const initialState = unloadedState.reducer(undefined, incomingAction);

    const expectedState: TestStore.State = {
      isLoading: false,
      config: undefined,
      error: undefined,
    };

    expect(initialState).toEqual(expectedState);
  });

  it('should return state if action type is not matched', () => {
    const initialState: TestStore.State = {
      isLoading: false,
      config: undefined,
      error: undefined,
    };
    const incomingAction = {
      type: 'OTHER_ACTION',
      isLoading: true,
      registries: [],
      resourceVersion: undefined,
    } as AnyAction;
    const newState = unloadedState.reducer(initialState, incomingAction);

    const expectedState: TestStore.State = {
      isLoading: false,
      config: undefined,
      error: undefined,
    };
    expect(newState).toEqual(expectedState);
  });

  it('should handle REQUEST_GITCONFIG', () => {
    const initialState: TestStore.State = {
      isLoading: false,
      config: undefined,
      error: undefined,
    };
    const incomingAction: TestStore.RequestGitConfigAction = {
      type: TestStore.Type.REQUEST_GITCONFIG,
      check: AUTHORIZED,
    };

    const newState = unloadedState.reducer(initialState, incomingAction);

    const expectedState: TestStore.State = {
      isLoading: true,
      config: undefined,
      error: undefined,
    };

    expect(newState).toEqual(expectedState);
  });

  it('should handle RECEIVE_GITCONFIG', () => {
    const initialState: TestStore.State = {
      isLoading: true,
      config: undefined,
      error: undefined,
    };
    const incomingAction: TestStore.ReceiveGitConfigAction = {
      type: TestStore.Type.RECEIVE_GITCONFIG,
      config: {
        gitconfig: {
          user: {
            email: 'user@che',
            name: 'user-che',
          },
        },
        resourceVersion: '345',
      },
    };

    const newState = unloadedState.reducer(initialState, incomingAction);

    const expectedState: TestStore.State = {
      isLoading: false,
      config: {
        gitconfig: {
          user: {
            email: 'user@che',
            name: 'user-che',
          },
        },
        resourceVersion: '345',
      },
      error: undefined,
    };

    expect(newState).toEqual(expectedState);
  });

  it('should handle RECEIVE_GITCONFIG_ERROR', () => {
    const initialState: TestStore.State = {
      isLoading: true,
      config: undefined,
      error: undefined,
    };
    const incomingAction: TestStore.ReceiveGitConfigErrorAction = {
      type: TestStore.Type.RECEIVE_GITCONFIG_ERROR,
      error: 'unexpected error',
    };

    const newState = unloadedState.reducer(initialState, incomingAction);

    const expectedState: TestStore.State = {
      isLoading: false,
      config: undefined,
      error: 'unexpected error',
    };

    expect(newState).toEqual(expectedState);
  });
});
