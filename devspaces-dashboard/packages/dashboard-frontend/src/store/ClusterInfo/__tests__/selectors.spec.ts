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
import { selectApplications, selectClusterInfoError } from '@/store/ClusterInfo/selectors';

import * as store from '..';

const applications = [
  {
    title: 'App1',
    url: 'my/app/1',
    icon: 'my/app/1/logo',
  },
  {
    title: 'App2',
    url: 'my/app/2',
    icon: 'my/app/2/logo',
  },
];
describe('ClusterInfo', () => {
  it('should return an error', () => {
    const fakeStore = new FakeStoreBuilder()
      .withClusterInfo({ applications }, false, 'Something unexpected')
      .build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, store.KnownAction>
    >;
    const state = fakeStore.getState();

    const selectedError = selectClusterInfoError(state);
    expect(selectedError).toEqual('Something unexpected');
  });

  it('should return all applications', () => {
    const fakeStore = new FakeStoreBuilder()
      .withClusterInfo({ applications }, false, 'Something unexpected')
      .build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, store.KnownAction>
    >;
    const state = fakeStore.getState();

    const selectedApps = selectApplications(state);
    expect(selectedApps).toEqual(applications);
  });
});
