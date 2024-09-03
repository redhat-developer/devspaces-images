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

import { MockStoreEnhanced } from 'redux-mock-store';
import { ThunkDispatch } from 'redux-thunk';

import { isRunningDevWorkspacesClusterLimitExceeded } from '@/services/backend-client/devWorkspaceClusterApi';
import { AppState } from '@/store';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import {
  actionCreators,
  checkRunningDevWorkspacesClusterLimitExceeded,
  reducer,
  RunningDevWorkspacesClusterLimitExceededError,
  unloadedState,
} from '@/store/DevWorkspacesCluster';
import * as testStore from '@/store/DevWorkspacesCluster';
import { selectRunningDevWorkspacesClusterLimitExceeded } from '@/store/DevWorkspacesCluster/selectors';
import { AUTHORIZED } from '@/store/sanityCheckMiddleware';

jest.mock('@/services/backend-client/devWorkspaceClusterApi');

describe('Test DevWorkspaceCluster selector', () => {
  it('test selector', () => {
    const store = new FakeStoreBuilder()
      .withDevWorkspacesCluster({
        isRunningDevWorkspacesClusterLimitExceeded: true,
      })
      .build();
    const state = store.getState();

    const isRunningDevWorkspacesClusterLimitExceeded =
      selectRunningDevWorkspacesClusterLimitExceeded.apply(null, [state]);

    expect(isRunningDevWorkspacesClusterLimitExceeded).toEqual(true);
  });
});

describe('Test checkRunningDevWorkspacesClusterLimitExceeded', () => {
  it('checkRunningDevWorkspacesClusterLimitExceeded should throw error', () => {
    const store = new FakeStoreBuilder()
      .withDevWorkspacesCluster({
        isRunningDevWorkspacesClusterLimitExceeded: true,
      })
      .build();
    const state = store.getState();

    try {
      checkRunningDevWorkspacesClusterLimitExceeded(state);
      fail('Expected an error');
    } catch (error) {
      expect(error).toBeInstanceOf(RunningDevWorkspacesClusterLimitExceededError);
    }
  });

  it('checkRunningDevWorkspacesClusterLimitExceeded should not throw error', () => {
    const store = new FakeStoreBuilder()
      .withDevWorkspacesCluster({
        isRunningDevWorkspacesClusterLimitExceeded: false,
      })
      .build();
    const state = store.getState();

    try {
      checkRunningDevWorkspacesClusterLimitExceeded(state);
    } catch (error) {
      fail('Unexpected error');
    }
  });
});

describe('Test DevWorkspaceCluster reducer', () => {
  const state = {
    isLoading: false,
    error: undefined,
    isRunningDevWorkspacesClusterLimitExceeded: false,
  };

  it('should return unloaded state', () => {
    const state = reducer.apply(null, [undefined, { type: 'REQUEST_DEVWORKSPACES_CLUSTER' }]);

    expect(state).toEqual(unloadedState);
  });

  it('Test REQUEST_DEVWORKSPACES_CLUSTER action', () => {
    const result = reducer.apply(null, [state, { type: 'REQUEST_DEVWORKSPACES_CLUSTER' }]);

    expect(result.isLoading).toEqual(true);
    expect(result.error).toBeUndefined();
    expect(result.isRunningDevWorkspacesClusterLimitExceeded).toBeFalsy();
  });

  it('Test RECEIVED_DEVWORKSPACES_CLUSTER action', () => {
    const result = reducer.apply(null, [
      state,
      { type: 'RECEIVED_DEVWORKSPACES_CLUSTER', isRunningDevWorkspacesClusterLimitExceeded: true },
    ]);

    expect(result.isLoading).toEqual(false);
    expect(result.error).toBeUndefined();
    expect(result.isRunningDevWorkspacesClusterLimitExceeded).toBeTruthy();
  });

  it('Test RECEIVED_DEVWORKSPACES_CLUSTER_ERROR action', () => {
    const result = reducer.apply(null, [
      state,
      { type: 'RECEIVED_DEVWORKSPACES_CLUSTER_ERROR', error: 'error' },
    ]);

    expect(result.isLoading).toEqual(false);
    expect(result.error).toEqual('error');
    expect(result.isRunningDevWorkspacesClusterLimitExceeded).toBeFalsy();
  });
});

describe('Test DevWorkspaceCluster ActionCreators', () => {
  let appStore: MockStoreEnhanced<
    AppState,
    ThunkDispatch<AppState, undefined, testStore.KnownAction>
  >;

  beforeEach(() => {
    appStore = new FakeStoreBuilder().build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, testStore.KnownAction>
    >;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Test dispatch RECEIVED_DEVWORKSPACES_CLUSTER action', async () => {
    const spyDispatch = jest.spyOn(appStore, 'dispatch');

    (isRunningDevWorkspacesClusterLimitExceeded as jest.Mock).mockReturnValue(
      Promise.resolve(true),
    );

    await actionCreators
      .requestRunningDevWorkspacesClusterLimitExceeded()
      .apply(null, [appStore.dispatch, appStore.getState, null]);

    expect(spyDispatch).toHaveBeenCalledTimes(2);
    expect(spyDispatch).toHaveBeenCalledWith({
      type: 'REQUEST_DEVWORKSPACES_CLUSTER',
      check: AUTHORIZED,
    });
    expect(spyDispatch).toHaveBeenCalledWith({
      type: 'RECEIVED_DEVWORKSPACES_CLUSTER',
      isRunningDevWorkspacesClusterLimitExceeded: true,
    });
  });

  it('Test dispatch RECEIVED_DEVWORKSPACES_CLUSTER_ERROR action', async () => {
    const spyDispatch = jest.spyOn(appStore, 'dispatch');

    (isRunningDevWorkspacesClusterLimitExceeded as jest.Mock).mockRejectedValueOnce(
      new Error('error'),
    );

    try {
      await actionCreators
        .requestRunningDevWorkspacesClusterLimitExceeded()
        .apply(null, [appStore.dispatch, appStore.getState, null]);
      fail('Expected an error');
    } catch (e) {
      expect(spyDispatch).toHaveBeenCalledTimes(2);
      expect(spyDispatch).toHaveBeenCalledWith({
        type: 'REQUEST_DEVWORKSPACES_CLUSTER',
        check: AUTHORIZED,
      });
      expect(spyDispatch).toHaveBeenCalledWith({
        type: 'RECEIVED_DEVWORKSPACES_CLUSTER_ERROR',
        error: 'error',
      });
    }
  });
});
