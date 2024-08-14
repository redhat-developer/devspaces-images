/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { Action } from 'redux';

import { reducer, unloadedState } from '@/store/Workspaces/Preferences/reducer';
import { KnownAction, State, Type } from '@/store/Workspaces/Preferences/types';

describe('Workspace preferences, reducer', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const initialState = unloadedState;

  it('should return the initial state when an unknown action is provided', () => {
    const unknownAction: Action = { type: 'UNKNOWN_ACTION' };

    const expectedState = initialState;

    const state = reducer(undefined, unknownAction);

    expect(state).toEqual(expectedState);
  });

  it('should handle REQUEST_PREFERENCES action', () => {
    const action: Action = {
      type: Type.REQUEST_PREFERENCES,
    };

    const expectedState: State = {
      ...initialState,
      isLoading: true,
    };

    const state = reducer(initialState, action);

    expect(state).toEqual(expectedState);
  });

  it('should handle RECEIVE_PREFERENCES action', () => {
    const preferences = {
      'skip-authorisation': [],
    };
    const action: KnownAction = {
      type: Type.RECEIVE_PREFERENCES,
      preferences,
    };

    const expectedState: State = {
      ...initialState,
      isLoading: false,
      preferences,
    };

    const state = reducer(initialState, action);

    expect(state).toEqual(expectedState);
  });

  it('should handle ERROR_PREFERENCES action', () => {
    const error = 'error';
    const action: KnownAction = {
      type: Type.ERROR_PREFERENCES,
      error,
    };

    const expectedState: State = {
      ...initialState,
      isLoading: false,
      error,
    };

    const state = reducer(initialState, action);

    expect(state).toEqual(expectedState);
  });
});
