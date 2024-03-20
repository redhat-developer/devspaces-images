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

import React from 'react';

import { Props } from '@/pages/UserPreferences/GitServices/List';

export class GitServicesList extends React.PureComponent<Props> {
  render(): React.ReactNode {
    const { isDisabled, gitOauth, providersWithToken, skipOauthProviders, onRevokeServices } =
      this.props;

    return (
      <div data-testid="git-services-list">
        <div>GitServicesList</div>
        <div data-testid="number-of-git-services">{gitOauth.length}</div>
        <div data-testid="providers-with-token">{providersWithToken.join()}</div>
        <div data-testid="skip-oauth-providers">{skipOauthProviders.join()}</div>
        <div data-testid="list-is-disabled">{isDisabled ? 'true' : 'false'}</div>
        <button onClick={() => onRevokeServices(gitOauth)}>Revoke</button>
      </div>
    );
  }
}
