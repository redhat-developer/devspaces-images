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
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ResourcesEmptyIcon,
} from '@patternfly/react-icons';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { CheTooltip } from '@/components/CheTooltip';
import { AppState } from '@/store';
import * as GitOauthConfig from '@/store/GitOauthConfig';
import {
  selectProvidersWithToken,
  selectSkipOauthProviders,
} from '@/store/GitOauthConfig/selectors';

type State = {
  hasOauthToken: boolean;
  isSkipOauth: boolean;
};

type Props = MappedProps & {
  gitProvider: api.GitOauthProvider;
};

export class ProviderIcon extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    const hasOauthToken = this.hasOauthToken(this.props.gitProvider);
    const isSkipOauth = this.isSkipOauth(this.props.gitProvider);
    this.state = {
      hasOauthToken,
      isSkipOauth,
    };
  }

  public async componentDidMount(): Promise<void> {
    const hasOauthToken = this.hasOauthToken(this.props.gitProvider);
    const isSkipOauth = this.isSkipOauth(this.props.gitProvider);
    this.setState({
      hasOauthToken,
      isSkipOauth,
    });
  }

  public async componentDidUpdate(): Promise<void> {
    const hasOauthToken = this.hasOauthToken(this.props.gitProvider);
    const isSkipOauth = this.isSkipOauth(this.props.gitProvider);
    this.setState({
      hasOauthToken,
      isSkipOauth,
    });
  }

  private isSkipOauth(providerName: api.GitOauthProvider): boolean {
    return this.props.skipOauthProviders.includes(providerName);
  }

  private hasOauthToken(providerName: api.GitOauthProvider): boolean {
    return this.props.providersWithToken.includes(providerName);
  }

  public render(): React.ReactElement {
    const { hasOauthToken, isSkipOauth } = this.state;
    if (hasOauthToken) {
      return (
        <CheTooltip content={<span>Authorized</span>}>
          <CheckCircleIcon color="var(--pf-global--success-color--100)" />
        </CheTooltip>
      );
    } else if (isSkipOauth) {
      return (
        <CheTooltip content={<span>Authorization has been rejected by user.</span>}>
          <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" />
        </CheTooltip>
      );
    }

    return (
      <CheTooltip content={<span>Unauthorized</span>}>
        <ResourcesEmptyIcon color="var(--pf-global--disabled-color--100)" />
      </CheTooltip>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  providersWithToken: selectProvidersWithToken(state),
  skipOauthProviders: selectSkipOauthProviders(state),
});

const connector = connect(mapStateToProps, GitOauthConfig.actionCreators);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(ProviderIcon);
