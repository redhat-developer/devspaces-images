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
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ResourcesEmptyIcon,
} from '@patternfly/react-icons';
import React from 'react';

import { CheTooltip } from '@/components/CheTooltip';

export type Props = {
  gitProvider: api.GitOauthProvider;
  providersWithToken: api.GitOauthProvider[];
  skipOauthProviders: api.GitOauthProvider[];
};

export class GitServiceStatusIcon extends React.PureComponent<Props> {
  private isSkipOauth(): boolean {
    const { gitProvider, skipOauthProviders } = this.props;
    // Use includes filter to handle the bitbucket-server oauth 2 provider.
    // The bitbucket server oauth2 provider name is 'bitbucket',
    // but the corresponding 'skip oauth' item is 'bitbucket-server'.
    return skipOauthProviders.some(s => s.includes(gitProvider));
  }

  private hasOauthToken(): boolean {
    const { gitProvider, providersWithToken } = this.props;
    // Use includes filter to handle the bitbucket-server oauth 2 provider.
    // The bitbucket server oauth2 provider name is 'bitbucket',
    // but the corresponding 'provider with token' item is 'bitbucket-server'.
    return providersWithToken.some(p => p.includes(gitProvider));
  }

  public render(): React.ReactElement {
    const hasOauthToken = this.hasOauthToken();
    const isSkipOauth = this.isSkipOauth();

    if (hasOauthToken) {
      return (
        <CheTooltip content={<span>Authorized</span>}>
          <CheckCircleIcon
            data-testid="icon-authorized"
            color="var(--pf-global--success-color--100)"
          />
        </CheTooltip>
      );
    } else if (isSkipOauth) {
      return (
        <CheTooltip content={<span>Authorization has been rejected by user.</span>}>
          <ExclamationTriangleIcon
            data-testid="icon-declined"
            color="var(--pf-global--warning-color--100)"
          />
        </CheTooltip>
      );
    }

    return (
      <CheTooltip content={<span>Unauthorized</span>}>
        <ResourcesEmptyIcon
          data-testid="icon-unauthorized"
          color="var(--pf-global--disabled-color--100)"
        />
      </CheTooltip>
    );
  }
}
