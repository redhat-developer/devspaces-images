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

import devfileApi from '@/services/devfileApi';
import { reducer } from '@/store/FactoryResolver/reducer';
import { KnownAction, Resolver, State, Type } from '@/store/FactoryResolver/types';
import { AUTHORIZED } from '@/store/sanityCheckMiddleware';

describe('FactoryResolver store, reducers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial state', () => {
    const incomingAction: KnownAction = {
      type: Type.REQUEST_FACTORY_RESOLVER,
      check: AUTHORIZED,
    };

    const initialState = reducer(undefined, incomingAction);
    const expectedState: State = {
      isLoading: false,
    };

    expect(initialState).toEqual(expectedState);
  });

  it('should return state if action is not matched', () => {
    const initialState: State = {
      isLoading: true,
    };
    const incomingAction = {
      type: 'OTHER_ACTION',
    };

    const newState = reducer(initialState, incomingAction);
    const expectedState: State = {
      isLoading: true,
    };

    expect(newState).toEqual(expectedState);
  });

  it('should handle REQUEST_FACTORY_RESOLVER', () => {
    const initialState: State = {
      isLoading: false,
    };
    const incomingAction: KnownAction = {
      type: Type.REQUEST_FACTORY_RESOLVER,
      check: AUTHORIZED,
    };

    const newState = reducer(initialState, incomingAction);
    const expectedState: State = {
      isLoading: true,
    };

    expect(newState).toEqual(expectedState);
  });

  it('should handle RECEIVE_FACTORY_RESOLVER', () => {
    const initialState: State = {
      isLoading: true,
    };
    const resolver = {
      devfile: {
        schemaVersion: '2.0.0',
      } as devfileApi.Devfile,
    } as Resolver;
    const incomingAction: KnownAction = {
      type: Type.RECEIVE_FACTORY_RESOLVER,
      resolver,
    };

    const newState = reducer(initialState, incomingAction);
    const expectedState: State = {
      isLoading: false,
      resolver,
    };

    expect(newState).toEqual(expectedState);
  });

  it('should handle RECEIVE_FACTORY_RESOLVER_ERROR', () => {
    const initialState: State = {
      isLoading: true,
    };
    const incomingAction: KnownAction = {
      type: Type.RECEIVE_FACTORY_RESOLVER_ERROR,
      error: 'Unexpected error',
    };

    const newState = reducer(initialState, incomingAction);
    const expectedState: State = {
      isLoading: false,
      error: 'Unexpected error',
    };

    expect(newState).toEqual(expectedState);
  });
});
