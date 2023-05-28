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
import * as testStore from '..';
import { AUTHORIZED } from '../../../sanityCheckMiddleware';

const cheUserId = 'che-user-id';

describe('UserId store, reducers', () => {
  // let userProfile: api.IUserProfile;

  it('should return initial state', () => {
    const incomingAction: testStore.RequestCheUserIdAction = {
      type: testStore.Type.REQUEST_CHE_USER_ID,
      check: AUTHORIZED,
    };
    const initialState = testStore.reducer(undefined, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      cheUserId: '',
    };

    expect(initialState).toEqual(expectedState);
  });

  it('should return state if action type is not matched', () => {
    const initialState: testStore.State = {
      isLoading: true,
      cheUserId: '',
    };
    const incomingAction = {
      type: 'OTHER_ACTION',
    } as AnyAction;
    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: true,
      cheUserId: '',
    };
    expect(newState).toEqual(expectedState);
  });

  it('should handle REQUEST_CHE_USER_ID', () => {
    const initialState: testStore.State = {
      isLoading: false,
      cheUserId: '',
      error: 'unexpected error',
    };
    const incomingAction: testStore.RequestCheUserIdAction = {
      type: testStore.Type.REQUEST_CHE_USER_ID,
      check: AUTHORIZED,
    };

    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: true,
      cheUserId: '',
    };

    expect(newState).toEqual(expectedState);
  });

  it('should handle RECEIVE_CHE_USER_ID', () => {
    const initialState: testStore.State = {
      isLoading: true,
      cheUserId: '',
    };
    const incomingAction: testStore.ReceiveCheUserAction = {
      type: testStore.Type.RECEIVE_CHE_USER_ID,
      cheUserId,
    };

    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      cheUserId,
    };

    expect(newState).toEqual(expectedState);
  });

  it('should handle RECEIVE_CHE_USER_ID_ERROR', () => {
    const initialState: testStore.State = {
      isLoading: true,
      cheUserId: '',
    };
    const incomingAction: testStore.ReceiveCheUserErrorAction = {
      type: testStore.Type.RECEIVE_CHE_USER_ID_ERROR,
      error: 'unexpected error',
    };

    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      cheUserId: '',
      error: 'unexpected error',
    };

    expect(newState).toEqual(expectedState);
  });
});
