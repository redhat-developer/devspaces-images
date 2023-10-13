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

import { CoreV1Event } from '@kubernetes/client-node';
import { cloneDeep } from 'lodash';
import { AnyAction } from 'redux';

import * as stub from '@/store/Events/__tests__/stubs';
import { AUTHORIZED } from '@/store/sanityCheckMiddleware';

import * as testStore from '..';

describe('Events store, reducers', () => {
  let event1: CoreV1Event;
  let event2: CoreV1Event;

  beforeEach(() => {
    event1 = cloneDeep(stub.event1);
    event2 = cloneDeep(stub.event2);
  });

  it('should return initial state', () => {
    const incomingAction: testStore.RequestEventsAction = {
      type: testStore.Type.REQUEST_EVENTS,
      check: AUTHORIZED,
    };
    const initialState = testStore.reducer(undefined, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      events: [],
      resourceVersion: '0',
    };

    expect(initialState).toEqual(expectedState);
  });

  it('should return state if action type is not matched', () => {
    const initialState: testStore.State = {
      isLoading: true,
      events: [event1, event2],
      resourceVersion: '0',
    };
    const incomingAction = {
      type: 'OTHER_ACTION',
    } as AnyAction;
    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: true,
      events: [event1, event2],
      resourceVersion: '0',
    };
    expect(newState).toEqual(expectedState);
  });

  it('should handle REQUEST_EVENTS', () => {
    const initialState: testStore.State = {
      isLoading: false,
      events: [],
      error: 'unexpected error',
      resourceVersion: '0',
    };
    const incomingAction: testStore.RequestEventsAction = {
      type: testStore.Type.REQUEST_EVENTS,
      check: AUTHORIZED,
    };

    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: true,
      events: [],
      resourceVersion: '0',
    };

    expect(newState).toEqual(expectedState);
  });

  it('should handle RECEIVE_EVENTS', () => {
    const initialState: testStore.State = {
      isLoading: true,
      events: [event1],
      resourceVersion: '1',
    };
    const incomingAction: testStore.ReceiveEventsAction = {
      type: testStore.Type.RECEIVE_EVENTS,
      events: [event2],
      resourceVersion: '2',
    };

    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      events: [event1, event2],
      resourceVersion: '2',
    };

    expect(newState).toEqual(expectedState);
  });

  it('should handle MODIFY_EVENT', () => {
    const initialState: testStore.State = {
      isLoading: false,
      events: [event1, event2],
      resourceVersion: '1',
    };

    const modifiedEvent = cloneDeep(event1);
    modifiedEvent.message = 'modified message';
    const incomingAction: testStore.ModifyEventAction = {
      type: testStore.Type.MODIFY_EVENT,
      event: modifiedEvent,
    };

    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      events: [modifiedEvent, event2],
      resourceVersion: '1',
    };

    expect(newState).toEqual(expectedState);
  });

  it('should handle RECEIVE_ERROR', () => {
    const initialState: testStore.State = {
      isLoading: true,
      events: [],
      resourceVersion: '0',
    };
    const incomingAction: testStore.ReceiveErrorAction = {
      type: testStore.Type.RECEIVE_ERROR,
      error: 'unexpected error',
    };

    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      events: [],
      error: 'unexpected error',
      resourceVersion: '0',
    };

    expect(newState).toEqual(expectedState);
  });

  it('should handle DELETE_EVENTS', () => {
    event1.metadata.resourceVersion = '1';
    event2.metadata.resourceVersion = '2';
    const initialState: testStore.State = {
      isLoading: false,
      events: [event1, event2],
      resourceVersion: '2',
    };

    const nextEvent1 = cloneDeep(event1);
    nextEvent1.metadata.resourceVersion = '3';
    const incomingAction: testStore.DeleteEventAction = {
      type: testStore.Type.DELETE_EVENT,
      event: nextEvent1,
    };

    const newState = testStore.reducer(initialState, incomingAction);

    const expectedState: testStore.State = {
      isLoading: false,
      events: [event2],
      resourceVersion: '3',
    };

    expect(newState).toEqual(expectedState);
  });
});
