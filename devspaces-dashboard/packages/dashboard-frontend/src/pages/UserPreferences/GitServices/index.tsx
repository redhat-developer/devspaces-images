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

import { api, helpers } from '@eclipse-che/common';
import { AlertVariant, PageSection } from '@patternfly/react-core';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import ProgressIndicator from '@/components/Progress';
import { lazyInject } from '@/inversify.config';
import { GitServicesEmptyState } from '@/pages/UserPreferences/GitServices/EmptyState';
import { GitServicesList } from '@/pages/UserPreferences/GitServices/List';
import { GitServicesRevokeModal } from '@/pages/UserPreferences/GitServices/RevokeModal';
import { AppAlerts } from '@/services/alerts/appAlerts';
import { AppState } from '@/store';
import * as GitOauthConfigStore from '@/store/GitOauthConfig';
import {
  selectGitOauth,
  selectIsLoading,
  selectProvidersWithToken,
  selectSkipOauthProviders,
} from '@/store/GitOauthConfig/selectors';
import { IGitOauth } from '@/store/GitOauthConfig/types';
import * as PersonalAccessTokenStore from '@/store/PersonalAccessToken';

export const enabledProviders: api.GitOauthProvider[] = ['github', 'github_2', 'gitlab'];

type Props = MappedProps;

type State = {
  isModalOpen: boolean;
  selectedServices: IGitOauth[];
};

export class GitServices extends React.PureComponent<Props, State> {
  @lazyInject(AppAlerts)
  private readonly appAlerts: AppAlerts;

  constructor(props: Props) {
    super(props);

    this.state = {
      isModalOpen: false,
      selectedServices: [],
    };
  }

  public async componentDidMount(): Promise<void> {
    const { isLoading } = this.props;
    if (!isLoading) {
      await this.requestGitServices();
    }
  }

  private async requestGitServices(): Promise<void> {
    const { requestGitOauthConfig } = this.props;
    try {
      await requestGitOauthConfig();
    } catch (e) {
      this.appAlerts.showAlert({
        key: 'request-git-services-failed',
        variant: AlertVariant.danger,
        title: helpers.errors.getMessage(e),
      });
    }
  }

  private async revokeToken(service: IGitOauth): Promise<void> {
    const { revokeOauth } = this.props;

    try {
      await revokeOauth(service.name);

      this.appAlerts.showAlert({
        key: 'revoke-' + service.name,
        variant: AlertVariant.success,
        title: `Git OAuth "${service.name}" has been revoked`,
      });
    } catch (e) {
      this.appAlerts.showAlert({
        key: 'revoke-' + service.name,
        variant: AlertVariant.danger,
        title: helpers.errors.getMessage(e),
      });
    }
  }

  private async handleModalRevoke(): Promise<void> {
    this.setState({
      isModalOpen: false,
    });

    const { selectedServices } = this.state;

    for (const service of selectedServices) {
      await this.revokeToken(service);
    }

    await Promise.allSettled([
      // refresh the Git services authentication status
      this.requestGitServices(),

      // refresh the personal access tokens
      this.props.requestTokens().catch(),
    ]);

    this.setState({
      selectedServices: [],
    });
  }

  private handleModalClose(): void {
    this.setState({
      isModalOpen: false,
    });
  }

  private handleRevokeServices(selectedServices: IGitOauth[] = []): void {
    this.setState({
      selectedServices,
      isModalOpen: true,
    });
  }

  private handleClearServices(selectedService: api.GitOauthProvider): void {
    this.props.deleteSkipOauth(selectedService);
  }

  render(): React.ReactNode {
    const { gitOauth, isLoading, providersWithToken, skipOauthProviders } = this.props;
    const { isModalOpen, selectedServices } = this.state;

    return (
      <React.Fragment>
        <ProgressIndicator isLoading={isLoading} />
        <PageSection>
          <GitServicesRevokeModal
            isOpen={isModalOpen}
            selectedItems={selectedServices}
            onCancel={() => this.handleModalClose()}
            onRevoke={() => this.handleModalRevoke()}
          />

          {gitOauth.length === 0 ? (
            <GitServicesEmptyState text="No Git Services" />
          ) : (
            <GitServicesList
              gitOauth={gitOauth}
              isDisabled={isLoading}
              providersWithToken={providersWithToken}
              skipOauthProviders={skipOauthProviders}
              onRevokeServices={services => this.handleRevokeServices(services)}
              onClearService={service => this.handleClearServices(service)}
            />
          )}
        </PageSection>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  gitOauth: selectGitOauth(state),
  isLoading: selectIsLoading(state),
  providersWithToken: selectProvidersWithToken(state),
  skipOauthProviders: selectSkipOauthProviders(state),
});

const connector = connect(mapStateToProps, {
  ...GitOauthConfigStore.actionCreators,
  ...PersonalAccessTokenStore.actionCreators,
});

type MappedProps = ConnectedProps<typeof connector>;
export default connector(GitServices);
