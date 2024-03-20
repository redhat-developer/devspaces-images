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

import { GitServiceStatusIcon } from '@/pages/UserPreferences/GitServices/List/StatusIcon';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

describe('ProviderIcon', () => {
  const gitOauth: api.GitOauthProvider = 'github';

  test('snapshot for the successfully authorized provider', () => {
    const snapshot = createSnapshot(gitOauth, [gitOauth], []);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('snapshot for rejected provider', () => {
    const snapshot = createSnapshot(gitOauth, [], [gitOauth]);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('snapshot for the provider not authorized yet', () => {
    const snapshot = createSnapshot(gitOauth, [], []);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('rendering for the successfully authorized provider', () => {
    const { reRenderComponent } = renderComponent(gitOauth, [], []);

    expect(screen.queryByTestId('icon-unauthorized')).not.toBeNull();
    expect(screen.queryByTestId('icon-authorized')).toBeNull();

    reRenderComponent(gitOauth, [gitOauth], []);

    expect(screen.queryByTestId('icon-unauthorized')).toBeNull();
    expect(screen.queryByTestId('icon-authorized')).not.toBeNull();
  });
});

function getComponent(
  gitOauth: api.GitOauthProvider,
  providersWithToken: api.GitOauthProvider[],
  skipOauthProviders: api.GitOauthProvider[],
): React.ReactElement {
  return (
    <GitServiceStatusIcon
      gitProvider={gitOauth}
      providersWithToken={providersWithToken}
      skipOauthProviders={skipOauthProviders}
    />
  );
}
