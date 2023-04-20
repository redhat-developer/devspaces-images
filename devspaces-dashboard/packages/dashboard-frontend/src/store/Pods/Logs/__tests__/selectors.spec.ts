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
import { selectAllLogs, selectPodLogs } from '../selectors';

describe('Logs store, selectors', () => {
  let logs: store.State['logs'];

  beforeEach(() => {
    logs = {
      pod1: {
        containers: {
          container1: {
            logs: 'container1 logs',
            failure: false,
          },
          initContainer1: {
            logs: 'initContainer1 logs',
            failure: false,
          },
        },
      },
      pod2: {
        containers: {
          container2: {
            logs: 'something went wrong',
            failure: true,
          },
        },
      },
    };
  });

  it('should return all logs', () => {
    const fakeStore = new FakeStoreBuilder().withLogs(logs).build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, store.KnownAction>
    >;
    const state = fakeStore.getState();

    const allPods = selectAllLogs(state);
    expect(allPods).toStrictEqual(logs);
  });

  it('should return logs for a specified pod', () => {
    const fakeStore = new FakeStoreBuilder().withLogs(logs).build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, store.KnownAction>
    >;
    const state = fakeStore.getState();

    const podLogsFn = selectPodLogs(state);
    const podLogs = podLogsFn('pod1');
    expect(podLogs).toStrictEqual(logs['pod1']?.containers);
  });
});
