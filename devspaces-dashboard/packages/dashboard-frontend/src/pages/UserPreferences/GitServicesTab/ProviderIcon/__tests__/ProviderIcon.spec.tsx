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

import { api } from '@eclipse-che/common';
import React from 'react';
import { Provider } from 'react-redux';
import { AnyAction } from 'redux';
import { MockStoreEnhanced } from 'redux-mock-store';
import { ThunkDispatch } from 'redux-thunk';

import { ProviderIcon } from '@/pages/UserPreferences/GitServicesTab/ProviderIcon';
import getComponentRenderer from '@/services/__mocks__/getComponentRenderer';
import { AppState } from '@/store';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import {
  selectProvidersWithToken,
  selectSkipOauthProviders,
} from '@/store/GitOauthConfig/selectors';

const { createSnapshot } = getComponentRenderer(getComponent);

function getComponent(
  store: MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, AnyAction>>,
  gitOauth: api.GitOauthProvider,
): React.ReactElement {
  const state = store.getState();
  return (
    <Provider store={store}>
      <ProviderIcon
        gitProvider={gitOauth}
        providersWithToken={selectProvidersWithToken(state)}
        skipOauthProviders={selectSkipOauthProviders(state)}
        requestSkipAuthorizationProviders={jest.fn()}
        requestGitOauthConfig={jest.fn()}
        revokeOauth={jest.fn()}
        deleteSkipOauth={jest.fn()}
      />
    </Provider>
  );
}

describe('ProviderIcon component', () => {
  test('snapshot for the successfully authorized provider', () => {
    const gitOauth: api.GitOauthProvider = 'github';
    const store = new FakeStoreBuilder().withGitOauthConfig([], ['github'], []).build();

    const snapshot = createSnapshot(store, gitOauth);

    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('snapshot for rejected provider', () => {
    const gitOauth: api.GitOauthProvider = 'github';
    const store = new FakeStoreBuilder().withGitOauthConfig([], [], ['github']).build();

    const snapshot = createSnapshot(store, gitOauth);

    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('snapshot for the provider not authorized yet', () => {
    const gitOauth: api.GitOauthProvider = 'github';
    const store = new FakeStoreBuilder().withGitOauthConfig([], [], []).build();

    const snapshot = createSnapshot(store, gitOauth);

    expect(snapshot.toJSON()).toMatchSnapshot();
  });
});
