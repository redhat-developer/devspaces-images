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
import { Form } from '@patternfly/react-core';
import React from 'react';

import { DEFAULT_GIT_PROVIDER, PROVIDER_ENDPOINTS } from '@/pages/UserPreferences/const';
import { GitProviderEndpoint } from '@/pages/UserPreferences/PersonalAccessTokens/AddEditModal/Form/GitProviderEndpoint';
import { GitProviderOrganization } from '@/pages/UserPreferences/PersonalAccessTokens/AddEditModal/Form/GitProviderOrganization';
import { GitProviderSelector } from '@/pages/UserPreferences/PersonalAccessTokens/AddEditModal/Form/GitProviderSelector';
import { TokenData } from '@/pages/UserPreferences/PersonalAccessTokens/AddEditModal/Form/TokenData';
import { TokenName } from '@/pages/UserPreferences/PersonalAccessTokens/AddEditModal/Form/TokenName';
import { EditTokenProps } from '@/pages/UserPreferences/PersonalAccessTokens/types';

export type Props = EditTokenProps & {
  cheUserId: string;
  onChange: (token: api.PersonalAccessToken, isValid: boolean) => void;
};
export type State = {
  gitProvider: api.GitProvider;
  defaultGitProviderEndpoint: string;
  gitProviderEndpoint: string | undefined;
  gitProviderEndpointIsValid: boolean;
  gitProviderOrganization: string | undefined;
  gitProviderOrganizationIsValid: boolean;
  tokenName: string | undefined;
  tokenNameIsValid: boolean;
  tokenData: string | undefined;
  tokenDataIsValid: boolean;
};

export class AddEditModalForm extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    const { gitProviderEndpoint, gitProvider, tokenName, tokenData } = props.token || {
      gitProvider: DEFAULT_GIT_PROVIDER,
    };

    const gitProviderOrganization =
      props.token?.gitProvider === 'azure-devops' ? props.token.gitProviderOrganization : undefined;

    const isValid = this.props.isEdit;

    this.state = {
      gitProvider,
      defaultGitProviderEndpoint: PROVIDER_ENDPOINTS[DEFAULT_GIT_PROVIDER],
      gitProviderEndpoint,
      // next field is initially valid because a default value should be used instead of an empty string
      gitProviderEndpointIsValid: true,
      gitProviderOrganization,
      gitProviderOrganizationIsValid: isValid,
      tokenName,
      tokenNameIsValid: isValid,
      tokenData,
      tokenDataIsValid: isValid,
    };
  }

  private updateChangeToken(partialState: Partial<State>): void {
    const { cheUserId } = this.props;
    const nextState = { ...this.state, ...partialState };
    this.setState(nextState);

    const {
      gitProviderEndpoint = nextState.defaultGitProviderEndpoint,
      gitProviderEndpointIsValid,
      gitProvider,
      gitProviderOrganization = '',
      gitProviderOrganizationIsValid,
      tokenName = '',
      tokenNameIsValid,
      tokenData = '',
      tokenDataIsValid,
    } = nextState;

    if (gitProvider === 'azure-devops') {
      const token: api.PersonalAccessToken = {
        cheUserId,
        gitProviderEndpoint,
        gitProvider,
        gitProviderOrganization,
        tokenName,
        tokenData,
      };
      const isValid =
        gitProviderEndpointIsValid &&
        gitProviderOrganizationIsValid &&
        tokenNameIsValid &&
        tokenDataIsValid;
      this.props.onChange(token, isValid);
    } else {
      const token: api.PersonalAccessToken = {
        cheUserId,
        gitProviderEndpoint,
        gitProvider,
        tokenName,
        tokenData,
      };
      const isValid = gitProviderEndpointIsValid && tokenNameIsValid && tokenDataIsValid;
      this.props.onChange(token, isValid);
    }
  }

  private handleChangeGitProvider(gitProvider: api.GitProvider): void {
    this.updateChangeToken({
      gitProvider,
      defaultGitProviderEndpoint: PROVIDER_ENDPOINTS[gitProvider],
    });
  }

  private handleChangeGitProviderEndpoint(
    gitProviderEndpoint: string,
    gitProviderEndpointIsValid: boolean,
  ): void {
    this.updateChangeToken({
      gitProviderEndpoint,
      gitProviderEndpointIsValid,
    });
  }

  private handleChangeGitProviderOrganization(
    gitProviderOrganization: string,
    gitProviderOrganizationIsValid: boolean,
  ): void {
    this.updateChangeToken({
      gitProviderOrganization,
      gitProviderOrganizationIsValid,
    });
  }

  private handleChangeTokenName(tokenName: string, tokenNameIsValid: boolean): void {
    this.updateChangeToken({
      tokenName,
      tokenNameIsValid,
    });
  }

  private handleChangeTokenData(tokenData: string, tokenDataIsValid: boolean): void {
    const { isEdit } = this.props;
    if (isEdit && tokenDataIsValid === false) {
      tokenData = this.props.token.tokenData;
      tokenDataIsValid = true;
    }

    this.updateChangeToken({
      tokenData,
      tokenDataIsValid,
    });
  }

  public render(): React.ReactElement {
    const { isEdit } = this.props;
    const {
      gitProvider,
      defaultGitProviderEndpoint,
      gitProviderEndpoint,
      gitProviderOrganization,
      tokenData,
      tokenName,
    } = this.state;

    return (
      <Form onSubmit={e => e.preventDefault()}>
        <TokenName
          isEdit={isEdit}
          tokenName={tokenName}
          onChange={(...args) => this.handleChangeTokenName(...args)}
        />
        <GitProviderSelector
          provider={gitProvider}
          onSelect={(...args) => this.handleChangeGitProvider(...args)}
        />
        <GitProviderEndpoint
          defaultProviderEndpoint={defaultGitProviderEndpoint}
          providerEndpoint={gitProviderEndpoint}
          onChange={(...args) => this.handleChangeGitProviderEndpoint(...args)}
        />
        {gitProvider === 'azure-devops' && (
          <GitProviderOrganization
            providerOrganization={gitProviderOrganization}
            onChange={(...args) => this.handleChangeGitProviderOrganization(...args)}
          />
        )}
        <TokenData
          isEdit={isEdit}
          tokenData={tokenData}
          onChange={(...args) => this.handleChangeTokenData(...args)}
        />
      </Form>
    );
  }
}
