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

import { MockStoreEnhanced } from 'redux-mock-store';
import { ThunkDispatch } from 'redux-thunk';
import * as store from '..';
import { AppState } from '../../..';
import { FakeStoreBuilder } from '../../../__mocks__/storeBuilder';
import { selectCheUserId, selectCheUserIdError } from '../selectors';

describe('Pods store, selectors', () => {
  it('should return the error', () => {
    const fakeStore = new FakeStoreBuilder()
      .withCheUserId({ error: 'Something unexpected', cheUserId: 'che-user-id' }, false)
      .build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, store.KnownAction>
    >;
    const state = fakeStore.getState();

    const selectedError = selectCheUserIdError(state);
    expect(selectedError).toEqual('Something unexpected');
  });

  it('should return Che user ID', () => {
    const fakeStore = new FakeStoreBuilder()
      .withCheUserId({ cheUserId: 'che-user-id' }, false)
      .build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, store.KnownAction>
    >;
    const state = fakeStore.getState();

    const allPods = selectCheUserId(state);
    expect(allPods).toEqual('che-user-id');
  });
});
