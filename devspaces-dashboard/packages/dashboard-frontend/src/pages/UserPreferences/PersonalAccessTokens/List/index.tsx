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
import { PageSection } from '@patternfly/react-core';
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

import { PersonalAccessTokenListToolbar } from '@/pages/UserPreferences/PersonalAccessTokens/List/Toolbar';

const COLUMN_NAMES: Omit<
  Record<keyof api.PersonalAccessToken, string>,
  'cheUserId' | 'tokenData'
> = {
  tokenName: 'Name',
  gitProvider: 'Provider',
  gitProviderEndpoint: 'Endpoint',
};

export type Props = {
  isDisabled: boolean;
  tokens: api.PersonalAccessToken[];
  onAddToken: () => void;
  onEditToken: (token: api.PersonalAccessToken) => void;
  onDeleteTokens: (tokens: api.PersonalAccessToken[]) => void;
};
export type State = {
  selectedTokens: api.PersonalAccessToken[];
};

export class PersonalAccessTokenList extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      selectedTokens: [],
    };
  }

  private handleSelectAllTokens(
    _event: React.FormEvent<HTMLInputElement>,
    isSelected: boolean,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ...rest: unknown[]
  ): void {
    this.setState({
      selectedTokens: isSelected ? this.props.tokens : [],
    });
  }

  private handleSelectToken(
    _event: React.FormEvent<HTMLInputElement>,
    isSelected: boolean,
    rowIndex: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ...rest: unknown[]
  ): void {
    const selectedToken = this.props.tokens[rowIndex];
    const selectedTokens = isSelected
      ? [...this.state.selectedTokens, selectedToken]
      : this.state.selectedTokens.filter(token => token.tokenName !== selectedToken.tokenName);

    this.setState({
      selectedTokens,
    });
  }

  private handleAddToken(): void {
    this.props.onAddToken();
  }

  private handleEditToken(token: api.PersonalAccessToken): void {
    this.props.onEditToken(token);
  }

  private handleDeleteSelectedTokens(): void {
    this.props.onDeleteTokens(this.state.selectedTokens);
  }

  private handleDeleteToken(token: api.PersonalAccessToken): void {
    this.props.onDeleteTokens([token]);
  }

  private buildHeadRow(): React.ReactElement {
    const { isDisabled, tokens } = this.props;
    const { selectedTokens } = this.state;

    const areAllTokensSelected = selectedTokens.length === tokens.length;

    return (
      <Tr>
        <Th
          select={{
            onSelect: (...args) => this.handleSelectAllTokens(...args),
            isSelected: areAllTokensSelected,
            isDisabled: isDisabled,
            isHeaderSelectDisabled: isDisabled,
          }}
        />
        <Th>{COLUMN_NAMES.tokenName}</Th>
        <Th>{COLUMN_NAMES.gitProvider}</Th>
        <Th>{COLUMN_NAMES.gitProviderEndpoint}</Th>
        <Td />
      </Tr>
    );
  }

  private buildRowAction(token: api.PersonalAccessToken): IAction[] {
    return [
      {
        title: 'Edit Token',
        onClick: () => this.handleEditToken(token),
      },
      {
        title: 'Delete Token',
        onClick: () => this.handleDeleteToken(token),
      },
    ];
  }

  private buildBodyRows(): React.ReactElement[] {
    const { isDisabled, tokens } = this.props;
    const { selectedTokens } = this.state;

    return tokens.map((token, rowIndex) => {
      const rowActions = this.buildRowAction(token);
      return (
        <Tr key={token.tokenName}>
          <Td
            select={{
              rowIndex,
              onSelect: (...args) => this.handleSelectToken(...args),
              isSelected: selectedTokens.includes(token),
              disable: isDisabled,
            }}
          />
          <Td dataLabel={COLUMN_NAMES.tokenName}>{token.tokenName}</Td>
          <Td dataLabel={COLUMN_NAMES.gitProvider}>{token.gitProvider}</Td>
          <Td dataLabel={COLUMN_NAMES.gitProviderEndpoint}>{token.gitProviderEndpoint}</Td>
          <Td isActionCell>
            <ActionsColumn isDisabled={isDisabled} items={rowActions} />
          </Td>
        </Tr>
      );
    });
  }

  public render(): React.ReactElement {
    const { isDisabled } = this.props;
    const { selectedTokens } = this.state;
    const headRow = this.buildHeadRow();
    const bodyRows = this.buildBodyRows();

    return (
      <PageSection>
        <PersonalAccessTokenListToolbar
          isDisabled={isDisabled}
          selectedItems={selectedTokens}
          onAdd={() => this.handleAddToken()}
          onDelete={() => this.handleDeleteSelectedTokens()}
        />
        <TableComposable aria-label="Personal Access Tokens List" variant={TableVariant.compact}>
          <Thead>{headRow}</Thead>
          <Tbody>{bodyRows}</Tbody>
        </TableComposable>
      </PageSection>
    );
  }
}
