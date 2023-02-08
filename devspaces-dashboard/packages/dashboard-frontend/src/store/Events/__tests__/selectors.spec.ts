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
import { MockStoreEnhanced } from 'redux-mock-store';
import { ThunkDispatch } from 'redux-thunk';
import * as store from '..';
import { AppState } from '../..';
import { FakeStoreBuilder } from '../../__mocks__/storeBuilder';
import {
  selectAllEvents,
  selectEventsError,
  selectEventsFromResourceVersion,
  selectEventsResourceVersion,
} from '../selectors';
import * as stub from './stubs';

describe('Events store, selectors', () => {
  let event1: CoreV1Event;
  let event2: CoreV1Event;

  beforeEach(() => {
    event1 = cloneDeep(stub.event1);
    event2 = cloneDeep(stub.event2);
  });

  it('should return the error', () => {
    const fakeStore = new FakeStoreBuilder()
      .withEvents({ events: [], error: 'Something unexpected' }, false)
      .build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, store.KnownAction>
    >;
    const state = fakeStore.getState();

    const selectedError = selectEventsError(state);
    expect(selectedError).toEqual('Something unexpected');
  });

  it('should return all events', () => {
    const fakeStore = new FakeStoreBuilder()
      .withEvents({ events: [event1, event2] }, false)
      .build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, store.KnownAction>
    >;
    const state = fakeStore.getState();

    const allEvents = selectAllEvents(state);
    expect(allEvents).toEqual([event1, event2]);
  });

  it('should return the resource version', () => {
    const fakeStore = new FakeStoreBuilder()
      .withEvents({ events: [event1, event2], resourceVersion: '1234' }, false)
      .build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, store.KnownAction>
    >;
    const state = fakeStore.getState();

    const resourceVersion = selectEventsResourceVersion(state);
    expect(resourceVersion).toEqual('1234');
  });

  it('should return events starting from a resource version', () => {
    event1.metadata.resourceVersion = '1';
    event2.metadata.resourceVersion = '5';
    const fakeStore = new FakeStoreBuilder()
      .withEvents({ events: [event1, event2], resourceVersion: '1' }, false)
      .build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, store.KnownAction>
    >;
    const state = fakeStore.getState();

    const selectEventsFn = selectEventsFromResourceVersion(state);
    expect(typeof selectEventsFn).toEqual('function');

    const events = selectEventsFn('3');
    expect(events).toEqual([event2]);
  });
});
