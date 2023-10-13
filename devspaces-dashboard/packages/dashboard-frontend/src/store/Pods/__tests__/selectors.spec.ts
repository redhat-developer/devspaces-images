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

import { AppState } from '@/store';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { pod1, pod2 } from '@/store/Pods/__tests__/stub';
import { selectAllPods, selectPodsError, selectPodsResourceVersion } from '@/store/Pods/selectors';

import * as store from '..';

describe('Pods store, selectors', () => {
  it('should return the error', () => {
    const fakeStore = new FakeStoreBuilder()
      .withPods({ error: 'Something unexpected', pods: [] }, false)
      .build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, store.KnownAction>
    >;
    const state = fakeStore.getState();

    const selectedError = selectPodsError(state);
    expect(selectedError).toEqual('Something unexpected');
  });

  it('should return all pods', () => {
    const fakeStore = new FakeStoreBuilder()
      .withPods({ pods: [pod1, pod2] }, false)
      .build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, store.KnownAction>
    >;
    const state = fakeStore.getState();

    const allPods = selectAllPods(state);
    expect(allPods).toEqual([pod1, pod2]);
  });

  it('should return the resource version', () => {
    const fakeStore = new FakeStoreBuilder()
      .withPods({ pods: [pod1, pod2], resourceVersion: '1234' }, false)
      .build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, store.KnownAction>
    >;
    const state = fakeStore.getState();

    const resourceVersion = selectPodsResourceVersion(state);
    expect(resourceVersion).toEqual('1234');
  });
});
