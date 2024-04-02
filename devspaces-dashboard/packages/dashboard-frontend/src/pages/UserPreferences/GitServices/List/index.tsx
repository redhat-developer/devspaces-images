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
import { Button, ButtonVariant } from '@patternfly/react-core';
import {
  ActionsColumn,
  IAction,
  TableComposable,
  TableVariant,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@patternfly/react-table';
import React from 'react';

import { GIT_OAUTH_PROVIDERS } from '@/pages/UserPreferences/const';
import { GitServiceStatusIcon } from '@/pages/UserPreferences/GitServices/List/StatusIcon';
import { GitServiceTooltip } from '@/pages/UserPreferences/GitServices/List/Tooltip';
import { GitServicesToolbar } from '@/pages/UserPreferences/GitServices/Toolbar';
import { IGitOauth } from '@/store/GitOauthConfig/types';

export const CAN_REVOKE_FROM_DASHBOARD: ReadonlyArray<api.GitOauthProvider> = [
  'github',
  'github_2',
  'gitlab',
];

export type Props = {
  isDisabled: boolean;
  gitOauth: IGitOauth[];
  providersWithToken: api.GitOauthProvider[];
  skipOauthProviders: api.GitOauthProvider[];
  onRevokeServices: (services: IGitOauth[]) => void;
};

type State = {
  selectedItems: IGitOauth[];
};

export class GitServicesList extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      selectedItems: [],
    };
  }

  private buildHeadRow(): React.ReactElement {
    return (
      <Tr>
        <Th />
        <Th dataLabel="Git Service Name Column Header">Name</Th>
        <Th dataLabel="Git Service Endpoint URL Column Header">Server</Th>
        <Th dataLabel="Git Service Authorization Status Column Header">Authorization</Th>
        <Th dataLabel="Git Service Actions Column Header" />
      </Tr>
    );
  }

  private handleSelectItem(isSelected: boolean, rowIndex: number): void {
    const { gitOauth } = this.props;

    /* c8 ignore start */
    if (rowIndex === -1) {
      // Select all (header row checked)
      const selectedItems = isSelected && gitOauth.length > 0 ? gitOauth : [];
      this.setState({ selectedItems });
      return;
    }
    /* c8 ignore stop */

    // Select single row
    const selectedItem = gitOauth[rowIndex];
    this.setState((prevState: State) => {
      return {
        selectedItems: isSelected
          ? [...prevState.selectedItems, selectedItem]
          : prevState.selectedItems.filter(item => item !== selectedItem),
      };
    });
  }

  private deselectServices(services: IGitOauth[]): void {
    const { selectedItems } = this.state;
    this.setState({
      selectedItems: selectedItems.filter(s => !services.includes(s)),
    });
  }

  private buildBodyRows(): React.ReactNode[] {
    const { isDisabled, gitOauth, providersWithToken, skipOauthProviders } = this.props;
    const { selectedItems } = this.state;

    return (
      gitOauth
        // sort by display name
        .sort((serviceA, serviceB) => {
          return GIT_OAUTH_PROVIDERS[serviceA.name].localeCompare(
            GIT_OAUTH_PROVIDERS[serviceB.name],
          );
        })
        .map((service, rowIndex) => {
          const hasWarningMessage =
            this.isRevokeEnabled(service.name) === false &&
            this.hasOauthToken(service.name) === true;

          const canRevoke = this.isRevokeEnabled(service.name) === true;
          const hasToken = this.hasOauthToken(service.name) === true;
          const rowDisabled = isDisabled || canRevoke === false || hasToken === false;

          const actionItems = this.buildActionItems(service);

          return (
            <Tr key={service.name} data-testid={service.name}>
              <Td
                dataLabel="Git Service Checkbox"
                select={{
                  rowIndex,
                  onSelect: (_event, isSelected) => this.handleSelectItem(isSelected, rowIndex),
                  isSelected: selectedItems.includes(service),
                  disable: rowDisabled,
                }}
              />
              <Td dataLabel="Git Service Name">
                {GIT_OAUTH_PROVIDERS[service.name]}{' '}
                <GitServiceTooltip isVisible={hasWarningMessage} serverURI={service.endpointUrl} />
              </Td>
              <Td dataLabel="Git Service Endpoint URL">
                <Button
                  component="a"
                  variant={ButtonVariant.link}
                  href={service.endpointUrl}
                  isInline={true}
                  target="_blank"
                  rel="noreferer"
                >
                  {service.endpointUrl}
                </Button>
              </Td>
              <Td dataLabel="Git Service Authorization">
                <GitServiceStatusIcon
                  gitProvider={service.name}
                  providersWithToken={providersWithToken}
                  skipOauthProviders={skipOauthProviders}
                />
              </Td>
              <Td dataLabel="Git Service Actions" isActionCell={true}>
                <ActionsColumn isDisabled={rowDisabled} items={actionItems} />
              </Td>
            </Tr>
          );
        })
    );
  }

  private buildActionItems(service: IGitOauth): IAction[] {
    return [
      {
        title: 'Revoke',
        onClick: () => this.handleRevokeService(service),
      },
    ];
  }

  private isRevokeEnabled(providerName: api.GitOauthProvider): boolean {
    return CAN_REVOKE_FROM_DASHBOARD.includes(providerName) === true;
  }

  private hasOauthToken(providerName: api.GitOauthProvider): boolean {
    return this.props.providersWithToken.includes(providerName);
  }

  private handleRevokeService(service: IGitOauth): void {
    this.props.onRevokeServices([service]);
    this.deselectServices([service]);
  }

  private async handleRevokeSelectedServices(): Promise<void> {
    const { selectedItems } = this.state;

    this.props.onRevokeServices(selectedItems);
    this.deselectServices(selectedItems);
  }

  render(): React.ReactNode {
    const { isDisabled } = this.props;
    const { selectedItems } = this.state;

    const headRow = this.buildHeadRow();
    const bodyRows = this.buildBodyRows();

    return (
      <React.Fragment>
        <GitServicesToolbar
          isDisabled={isDisabled}
          selectedItems={selectedItems}
          onRevokeButton={async () => await this.handleRevokeSelectedServices()}
        />

        <TableComposable aria-label="Git Services" variant={TableVariant.compact}>
          <Thead>{headRow}</Thead>
          <Tbody>{bodyRows}</Tbody>
        </TableComposable>
      </React.Fragment>
    );
  }
}
