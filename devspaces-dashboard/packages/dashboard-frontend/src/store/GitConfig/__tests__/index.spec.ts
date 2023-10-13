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

import { api } from '@eclipse-che/common';
import { MockStoreEnhanced } from 'redux-mock-store';
import { ThunkDispatch } from 'redux-thunk';

import { AppState } from '@/store';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { AUTHORIZED } from '@/store/sanityCheckMiddleware';

import * as TestStore from '..';

const mockFetchGitConfig = jest.fn().mockResolvedValue({ gitconfig: {} } as api.IGitConfig);
const mockPatchGitConfig = jest.fn().mockResolvedValue({ gitconfig: {} } as api.IGitConfig);
jest.mock('../../../services/backend-client/gitConfigApi', () => {
  return {
    fetchGitConfig: (...args: unknown[]) => mockFetchGitConfig(...args),
    patchGitConfig: (...args: unknown[]) => mockPatchGitConfig(...args),
  };
});

// mute the outputs
console.error = jest.fn();

describe('GitConfig store, actions', () => {
  let store: MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, TestStore.KnownAction>>;

  beforeEach(() => {
    store = new FakeStoreBuilder()
      .withInfrastructureNamespace([{ name: 'user-che', attributes: { phase: 'Active' } }])
      .build();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create REQUEST_GITCONFIG and RECEIVE_GITCONFIG when fetch the gitconfig', async () => {
    await store.dispatch(TestStore.actionCreators.requestGitConfig());

    const actions = store.getActions();

    const expectedActions: TestStore.KnownAction[] = [
      {
        type: TestStore.Type.REQUEST_GITCONFIG,
        check: AUTHORIZED,
      },
      {
        type: TestStore.Type.RECEIVE_GITCONFIG,
        config: { gitconfig: {} } as api.IGitConfig,
      },
    ];

    expect(actions).toEqual(expectedActions);

    expect(mockFetchGitConfig).toHaveBeenCalledTimes(1);
    expect(mockPatchGitConfig).toHaveBeenCalledTimes(0);
  });

  it('should create REQUEST_GITCONFIG and RECEIVE_GITCONFIG when got 404', async () => {
    mockFetchGitConfig.mockRejectedValueOnce({
      response: {
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config: {},
        data: {},
      },
    });

    try {
      await store.dispatch(TestStore.actionCreators.requestGitConfig());
    } catch (e) {
      // ignore
    }

    const actions = store.getActions();

    const expectedActions: TestStore.KnownAction[] = [
      {
        type: TestStore.Type.REQUEST_GITCONFIG,
        check: AUTHORIZED,
      },
      {
        type: TestStore.Type.RECEIVE_GITCONFIG,
        config: undefined,
      },
    ];

    expect(actions).toEqual(expectedActions);

    expect(mockFetchGitConfig).toHaveBeenCalledTimes(1);
    expect(mockPatchGitConfig).toHaveBeenCalledTimes(0);
  });

  it('should create REQUEST_GITCONFIG and RECEIVE_GITCONFIG_ERROR when fetch the gitconfig with error other than 404', async () => {
    mockFetchGitConfig.mockRejectedValueOnce(new Error('unexpected error'));

    try {
      await store.dispatch(TestStore.actionCreators.requestGitConfig());
    } catch (e) {
      // ignore
    }

    const actions = store.getActions();

    const expectedActions: TestStore.KnownAction[] = [
      {
        type: TestStore.Type.REQUEST_GITCONFIG,
        check: AUTHORIZED,
      },
      {
        type: TestStore.Type.RECEIVE_GITCONFIG_ERROR,
        error: 'unexpected error',
      },
    ];

    expect(actions).toEqual(expectedActions);

    expect(mockFetchGitConfig).toHaveBeenCalledTimes(1);
    expect(mockPatchGitConfig).toHaveBeenCalledTimes(0);
  });

  it('should create REQUEST_GITCONFIG and RECEIVE_GITCONFIG when path the gitconfig', async () => {
    await store.dispatch(
      TestStore.actionCreators.updateGitConfig({
        name: 'testname',
        email: 'test@email',
      }),
    );

    const actions = store.getActions();

    const expectedActions: TestStore.KnownAction[] = [
      {
        type: TestStore.Type.REQUEST_GITCONFIG,
        check: AUTHORIZED,
      },
      {
        type: TestStore.Type.RECEIVE_GITCONFIG,
        config: { gitconfig: {} } as api.IGitConfig,
      },
    ];

    expect(actions).toEqual(expectedActions);

    expect(mockFetchGitConfig).toHaveBeenCalledTimes(0);
    expect(mockPatchGitConfig).toHaveBeenCalledTimes(1);
    expect(mockPatchGitConfig).toHaveBeenCalledWith('user-che', {
      gitconfig: { user: { email: 'test@email', name: 'testname' } },
    });
  });

  it('should create REQUEST_GITCONFIG and RECEIVE_GITCONFIG_ERROR when path the gitconfig with error', async () => {
    mockPatchGitConfig.mockRejectedValueOnce(new Error('unexpected error'));

    try {
      await store.dispatch(
        TestStore.actionCreators.updateGitConfig({ name: 'testname', email: 'testemail' }),
      );
    } catch (e) {
      // ignore
    }

    const actions = store.getActions();

    const expectedActions: TestStore.KnownAction[] = [
      {
        type: TestStore.Type.REQUEST_GITCONFIG,
        check: AUTHORIZED,
      },
      {
        type: TestStore.Type.RECEIVE_GITCONFIG_ERROR,
        error: 'unexpected error',
      },
    ];

    expect(actions).toEqual(expectedActions);

    expect(mockFetchGitConfig).toHaveBeenCalledTimes(0);
    expect(mockPatchGitConfig).toHaveBeenCalledTimes(1);
    expect(mockPatchGitConfig).toHaveBeenCalledWith('user-che', {
      gitconfig: { user: { name: 'testname', email: 'testemail' } },
    });
  });
});
