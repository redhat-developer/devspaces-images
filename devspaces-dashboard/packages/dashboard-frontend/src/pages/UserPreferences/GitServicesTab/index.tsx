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
import { PageSection } from '@patternfly/react-core';
import { IActionsResolver, Table, TableBody, TableHeader } from '@patternfly/react-table';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import ProgressIndicator from '@/components/Progress';
import { GIT_OAUTH_PROVIDERS } from '@/pages/UserPreferences/const';
import EmptyState from '@/pages/UserPreferences/GitServicesTab/EmptyState';
import GitServicesToolbar, {
  GitServicesToolbar as Toolbar,
} from '@/pages/UserPreferences/GitServicesTab/GitServicesToolbar';
import ProviderIcon from '@/pages/UserPreferences/GitServicesTab/ProviderIcon';
import ProviderWarning from '@/pages/UserPreferences/GitServicesTab/ProviderWarning';
import { AppState } from '@/store';
import * as GitOauthConfig from '@/store/GitOauthConfig';
import {
  selectGitOauth,
  selectIsLoading,
  selectProvidersWithToken,
  selectSkipOauthProviders,
} from '@/store/GitOauthConfig/selectors';

export const enabledProviders: api.GitOauthProvider[] = ['github', 'github_2', 'gitlab'];

type Props = MappedProps;

type State = {
  selectedItems: api.GitOauthProvider[];
};

export class GitServices extends React.PureComponent<Props, State> {
  private readonly gitServicesToolbarRef: React.RefObject<Toolbar>;
  private readonly callbacks: {
    onChangeSelection?: (selectedItems: api.GitOauthProvider[]) => void;
  };

  constructor(props: Props) {
    super(props);

    this.gitServicesToolbarRef = React.createRef<Toolbar>();

    this.state = {
      selectedItems: [],
    };
  }

  private onChangeSelection(isSelected: boolean, rowIndex: number) {
    const { gitOauth } = this.props;
    if (rowIndex === -1) {
      const selectedItems = isSelected && gitOauth.length > 0 ? gitOauth.map(val => val.name) : [];
      this.setState({ selectedItems });
    } else {
      const selectedItem = gitOauth[rowIndex]?.name;
      this.setState((prevState: State) => {
        return {
          selectedItems: isSelected
            ? [...prevState.selectedItems, selectedItem]
            : prevState.selectedItems.filter(item => item !== selectedItem),
        };
      });
    }
  }

  public async componentDidMount(): Promise<void> {
    const { isLoading, requestGitOauthConfig } = this.props;
    if (!isLoading) {
      await requestGitOauthConfig();
    }
  }

  private buildGitOauthRow(gitOauth: api.GitOauthProvider, serverUrl: string): React.ReactNode[] {
    const hasWarningMessage = this.isDisabled(gitOauth) && this.hasOauthToken(gitOauth);

    const name = (
      <span key={gitOauth}>
        {GIT_OAUTH_PROVIDERS[gitOauth]}
        {hasWarningMessage && <ProviderWarning serverURI={serverUrl} />}
      </span>
    );

    const server = (
      <span key={serverUrl}>
        <a href={serverUrl} target="_blank" rel="noreferrer">
          {serverUrl}
        </a>
      </span>
    );

    const authorization = (
      <span key="Token">
        <ProviderIcon gitProvider={gitOauth} />
      </span>
    );

    return [name, server, authorization];
  }

  private isDisabled(providerName: api.GitOauthProvider): boolean {
    return (
      enabledProviders.includes(providerName) === false ||
      this.hasOauthToken(providerName) === false
    );
  }

  private isSkipOauth(providerName: api.GitOauthProvider): boolean {
    // Use includes filter to handle the bitbucket-server oauth 2 provider.
    // The bitbucket server oauth2 provider name is 'bitbucket',
    // but the corresponding 'skip oauth' item is 'bitbucket-server'.
    return this.props.skipOauthProviders.some(s => s.includes(providerName));
  }

  private hasOauthToken(providerName: api.GitOauthProvider): boolean {
    return this.props.providersWithToken.includes(providerName);
  }

  render(): React.ReactNode {
    const { isLoading, gitOauth } = this.props;
    const { selectedItems } = this.state;
    const columns = ['Name', 'Server', 'Authorization'];
    const rows =
      gitOauth.length > 0
        ? gitOauth.map(provider => {
            const canRevoke = !this.isDisabled(provider.name);
            const canClear = this.isSkipOauth(provider.name);
            return {
              cells: this.buildGitOauthRow(provider.name, provider.endpointUrl),
              selected: selectedItems.includes(provider.name),
              disableSelection: !canRevoke,
              disableActions: !canRevoke && !canClear,
              isValid: !this.isSkipOauth(provider.name),
            };
          })
        : [];

    const actionResolver: IActionsResolver = rowData => {
      if (!rowData.isValid) {
        return [
          {
            title: 'Clear',
            onClick: (event, rowIndex) => {
              event.stopPropagation();
              // Use includes filter to handle the bitbucket-server oauth 2 provider.
              // The bitbucket server oauth2 provider name is 'bitbucket',
              // but the corresponding 'skip oauth' item is 'bitbucket-server'.
              const itemName = gitOauth[rowIndex].name;
              const providerName = this.props.skipOauthProviders.find(s => s.includes(itemName));
              this.props.deleteSkipOauth(providerName !== undefined ? providerName : itemName);
            },
          },
        ];
      }
      return [
        {
          title: 'Revoke',
          onClick: (event, rowIndex) => {
            event.stopPropagation();
            this.gitServicesToolbarRef.current?.showOnRevokeGitOauthModal(rowIndex);
          },
        },
      ];
    };

    return (
      <React.Fragment>
        <ProgressIndicator isLoading={isLoading} />
        <PageSection>
          {rows.length === 0 ? (
            <EmptyState text="No Git Services" />
          ) : (
            <React.Fragment>
              <GitServicesToolbar
                ref={this.gitServicesToolbarRef}
                callbacks={this.callbacks}
                selectedItems={selectedItems}
              />
              <Table
                cells={columns}
                actionResolver={actionResolver}
                areActionsDisabled={rowData => !!rowData.disableActions}
                rows={rows}
                onSelect={(event, isSelected, rowIndex) => {
                  event.stopPropagation();
                  this.onChangeSelection(isSelected, rowIndex);
                }}
                canSelectAll={false}
                aria-label="Git services"
                variant="compact"
              >
                <TableHeader />
                <TableBody />
              </Table>
            </React.Fragment>
          )}
        </PageSection>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  gitOauth: selectGitOauth(state),
  providersWithToken: selectProvidersWithToken(state),
  skipOauthProviders: selectSkipOauthProviders(state),
  isLoading: selectIsLoading(state),
});

const connector = connect(mapStateToProps, GitOauthConfig.actionCreators);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(GitServices);
