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
import { AppState } from '../..';
import { FakeStoreBuilder } from '../../__mocks__/storeBuilder';
import * as store from '..';
import { selectApplications, selectApplicationsError } from '../selectors';

describe('External applications', () => {

  it('should return applications error', () => {
    const fakeStore = new FakeStoreBuilder()
      .withApplications(
        [{
          title: 'App1',
          url: 'my/app/1',
          icon: 'my/app/1/logo'
        }, {
          title: 'App2',
          url: 'my/app/2',
          icon: 'my/app/2/logo'
        }],
        false,
        'Something unexpected'
      ).build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, store.KnownAction>>;
    const state = fakeStore.getState();

    const selectedError = selectApplicationsError(state);
    expect(selectedError).toEqual('Something unexpected');
  });

  it('should return all applications', () => {
    const fakeStore = new FakeStoreBuilder()
      .withApplications(
        [{
          title: 'App1',
          url: 'my/app/1',
          icon: 'my/app/1/logo'
        }, {
          title: 'App2',
          url: 'my/app/2',
          icon: 'my/app/2/logo'
        }],
        false,
        'Something unexpected'
      ).build() as MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, store.KnownAction>>;
    const state = fakeStore.getState();

    const selectedApps = selectApplications(state);
    expect(selectedApps).toEqual(
      [{
        title: 'App1',
        url: 'my/app/1',
        icon: 'my/app/1/logo'
      }, {
        title: 'App2',
        url: 'my/app/2',
        icon: 'my/app/2/logo'
      }]
    );
  });

});
