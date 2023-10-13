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
import * as TestStore from '@/store/GitConfig';
import {
  selectGitConfigError,
  selectGitConfigIsLoading,
  selectGitConfigUser,
} from '@/store/GitConfig/selectors';

describe('GitConfig store, selectors', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the error', () => {
    const fakeStore = new FakeStoreBuilder()
      .withGitConfig({ config: {} as api.IGitConfig, error: 'Something unexpected' }, false)
      .build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, TestStore.KnownAction>
    >;
    const state = fakeStore.getState();

    const selectedError = selectGitConfigError(state);
    expect(selectedError).toEqual('Something unexpected');
  });

  it('should return the gitconfig', () => {
    const fakeStore = new FakeStoreBuilder()
      .withGitConfig({
        config: {
          gitconfig: {
            user: {
              name: 'user-che',
              email: 'user@che',
            },
          },
        },
      })
      .build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, TestStore.KnownAction>
    >;
    const state = fakeStore.getState();

    const gitconfig = selectGitConfigUser(state);
    expect(gitconfig).toEqual({
      name: 'user-che',
      email: 'user@che',
    });
  });

  it('should return isLoading state', () => {
    const fakeStore = new FakeStoreBuilder()
      .withGitConfig(
        {
          config: {
            gitconfig: {
              user: {
                name: 'user-che',
                email: 'user@che',
              },
            },
          },
        },
        true,
      )
      .build() as MockStoreEnhanced<
      AppState,
      ThunkDispatch<AppState, undefined, TestStore.KnownAction>
    >;
    const state = fakeStore.getState();

    const isLoading = selectGitConfigIsLoading(state);
    expect(isLoading).toEqual(true);
  });
});
