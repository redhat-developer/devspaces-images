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

import { PageSection } from '@patternfly/react-core';
import { Table, TableBody, TableHeader } from '@patternfly/react-table';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import ProgressIndicator from '../../../components/Progress';
import { AppState } from '../../../store';
import { selectIsLoading, selectGitOauth } from '../../../store/GitOauthConfig/selectors';
import EmptyState from './EmptyState';
import { api } from '@eclipse-che/common';
import * as GitOauthConfig from '../../../store/GitOauthConfig';
import GitServicesToolbar, { GitServicesToolbar as Toolbar } from './GitServicesToolbar';
import ProviderWarning from './ProviderWarning';

export const enabledProviders: api.GitOauthProvider[] = ['github'];

export const providersMap = {
  github: 'GitHub',
  gitlab: 'GitLab',
  bitbucket: 'Bitbucket',
  'azure-devops': 'Microsoft Azure DevOps',
};

type Props = MappedProps;

type State = {
  selectedItems: api.GitOauthProvider[];
};

export class GitServicesTab extends React.PureComponent<Props, State> {
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
      requestGitOauthConfig();
    }
  }

  private buildGitOauthRow(gitOauth: api.GitOauthProvider, server: string): React.ReactNode[] {
    const oauthRow: React.ReactNode[] = [];
    const isDisabled = this.isDisabled(gitOauth);

    oauthRow.push(
      <span key={gitOauth}>
        {providersMap[gitOauth]}
        {isDisabled && (
          <ProviderWarning
            warning={
              <>
                Provided API does not support the automatic token revocation. You can revoke it
                manually on &nbsp;
                <a
                  href={server}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--pf-global--info-color--100)' }}
                >
                  {server}
                </a>
                .
              </>
            }
          />
        )}
      </span>,
    );

    oauthRow.push(
      <span key={server}>
        <a href={server} target="_blank" rel="noreferrer">
          {server}
        </a>
      </span>,
    );

    return oauthRow;
  }

  private showOnRevokeGitOauthModal(rowIndex: number): void {
    this.gitServicesToolbarRef.current?.showOnRevokeGitOauthModal(rowIndex);
  }

  private isDisabled(providerName: api.GitOauthProvider): boolean {
    return !enabledProviders.includes(providerName);
  }

  render(): React.ReactNode {
    const { isLoading, gitOauth } = this.props;
    const { selectedItems } = this.state;
    const columns = ['Name', 'Server'];
    const actions = [
      {
        title: 'Revoke',
        onClick: (event, rowIndex) => this.showOnRevokeGitOauthModal(rowIndex),
      },
    ];
    const rows =
      gitOauth.length > 0
        ? gitOauth.map(provider => ({
            cells: this.buildGitOauthRow(provider.name, provider.endpointUrl),
            selected: selectedItems.includes(provider.name),
            disableSelection: this.isDisabled(provider.name),
            disableActions: this.isDisabled(provider.name),
          }))
        : [];

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
                actions={actions}
                areActionsDisabled={rowData => !!rowData.disableActions}
                rows={rows}
                onSelect={(event, isSelected, rowIndex) => {
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
  isLoading: selectIsLoading(state),
});

const connector = connect(mapStateToProps, GitOauthConfig.actionCreators);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(GitServicesTab);
