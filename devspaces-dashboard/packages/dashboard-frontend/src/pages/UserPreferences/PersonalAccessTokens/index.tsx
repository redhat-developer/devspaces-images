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

import { api, helpers } from '@eclipse-che/common';
import { AlertVariant, pluralize } from '@patternfly/react-core';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import ProgressIndicator from '../../../components/Progress';
import { lazyInject } from '../../../inversify.config';
import { AppAlerts } from '../../../services/alerts/appAlerts';
import { AppState } from '../../../store';
import * as PersonalAccessTokenStore from '../../../store/PersonalAccessToken';
import {
  selectPersonalAccessTokensIsLoading,
  selectPersonalAccessTokens,
  selectPersonalAccessTokensError,
} from '../../../store/PersonalAccessToken/selectors';
import * as UserIdStore from '../../../store/User/Id';
import {
  selectCheUserId,
  selectCheUserIdError,
  selectCheUserIsLoading,
} from '../../../store/User/Id/selectors';
import { PersonalAccessTokenAddEditModal } from './AddEditModal';
import { PersonalAccessTokenDeleteModal } from './DeleteModal';
import { PersonalAccessTokenEmptyState } from './EmptyState';
import { PersonalAccessTokenList } from './List';
import { EditTokenProps } from './types';

export type Props = MappedProps;
export type State = {
  isAddEditOpen: boolean;
  editToken: api.PersonalAccessToken | undefined;
  isDeleteOpen: boolean;
  deleteTokens: api.PersonalAccessToken[];
  isDeleting: boolean;
};

class PersonalAccessTokens extends React.PureComponent<Props, State> {
  @lazyInject(AppAlerts)
  private readonly appAlerts: AppAlerts;

  constructor(props: Props) {
    super(props);

    this.state = {
      isAddEditOpen: false,
      editToken: undefined,
      isDeleteOpen: false,
      deleteTokens: [],
      isDeleting: false,
    };
  }

  public async componentDidMount(): Promise<void> {
    const { cheUserIdIsLoading, personalAccessTokensIsLoading, requestCheUserId, requestTokens } =
      this.props;
    const promises: Array<Promise<unknown>> = [];
    if (!cheUserIdIsLoading) {
      promises.push(requestCheUserId());
    }
    if (!personalAccessTokensIsLoading) {
      promises.push(requestTokens());
    }
    const results = await Promise.allSettled(promises);
    // log failed promises into console
    results
      .filter(result => result.status === 'rejected')
      .forEach(result => console.error((result as PromiseRejectedResult).reason));
  }

  public componentDidUpdate(prevProps: Props): void {
    const { cheUserIdError, personalAccessTokensError } = this.props;
    if (cheUserIdError && cheUserIdError !== prevProps.cheUserIdError) {
      this.appAlerts.showAlert({
        key: 'che-user-id-error',
        title: `Failed to load user ID. ${helpers.errors.getMessage(cheUserIdError)}`,
        variant: AlertVariant.danger,
      });
    }
    if (
      personalAccessTokensError &&
      personalAccessTokensError !== prevProps.personalAccessTokensError
    ) {
      this.appAlerts.showAlert({
        key: 'personal-access-tokens-error',
        title: helpers.errors.getMessage(personalAccessTokensError),
        variant: AlertVariant.danger,
      });
    }
  }

  private handleShowAddEditModal(editToken?: api.PersonalAccessToken): void {
    this.setState({
      editToken,
      isAddEditOpen: true,
    });
  }

  private handleCloseAddEditModal(): void {
    this.setState({
      isAddEditOpen: false,
    });
  }

  private handleShowDeleteModal(deleteTokens: api.PersonalAccessToken[]): void {
    this.setState({
      isDeleteOpen: true,
      deleteTokens,
    });
  }

  private handleCloseDeleteModal(): void {
    this.setState({
      isDeleteOpen: false,
    });
  }

  private async handleSaveToken(personalAccessToken: api.PersonalAccessToken): Promise<void> {
    const { editToken } = this.state;

    this.setState({
      isAddEditOpen: false,
      editToken: undefined,
    });

    try {
      if (editToken) {
        await this.props.updateToken(personalAccessToken);
      } else {
        await this.props.addToken(personalAccessToken);
      }

      this.appAlerts.showAlert({
        key: 'save-token-success',
        title: 'Token saved successfully.',
        variant: AlertVariant.success,
      });
    } catch (error) {
      console.error('Failed to save token. ', error);
    }
  }

  private async handleDeleteTokens(deleteTokens: api.PersonalAccessToken[]): Promise<void> {
    this.setState({
      isDeleteOpen: false,
      isDeleting: true,
    });

    const promises = deleteTokens.map(async token => {
      try {
        return await this.props.removeToken(token);
      } catch (error) {
        console.error('Failed to delete token. ', error);
        throw error;
      }
    });
    const results = await Promise.allSettled(promises);

    this.setState({
      isDeleting: false,
    });

    const failedNumber = results.filter(result => result.status === 'rejected').length;
    const failedTokens = pluralize(failedNumber, 'token');

    const successNumber = results.filter(result => result.status === 'fulfilled').length;
    const successTokens = pluralize(successNumber, 'token');

    const allTokens = pluralize(deleteTokens.length, 'token');

    if (successNumber === deleteTokens.length) {
      this.appAlerts.showAlert({
        key: 'delete-tokens-success',
        title: `${successTokens} deleted successfully`,
        variant: AlertVariant.success,
      });
    } else {
      this.appAlerts.showAlert({
        key: 'delete-tokens-success',
        title: `${successNumber} of ${allTokens} deleted successfully`,
        variant: AlertVariant.success,
      });
      this.appAlerts.showAlert({
        key: 'delete-tokens-error',
        title: `Failed to delete ${failedTokens}`,
        variant: AlertVariant.danger,
      });
    }
  }

  public render(): React.ReactElement {
    const {
      cheUserId,
      cheUserIdError,
      cheUserIdIsLoading,
      personalAccessTokens,
      personalAccessTokensIsLoading,
    } = this.props;
    const { isAddEditOpen, isDeleteOpen, editToken, deleteTokens, isDeleting } = this.state;

    const isLoading = cheUserIdIsLoading || personalAccessTokensIsLoading;
    const isEdit = editToken !== undefined;
    const isDisabled = isLoading || isDeleting || cheUserIdError !== undefined;

    const editTokenProps: EditTokenProps = isEdit
      ? {
          isEdit,
          token: editToken,
        }
      : {
          isEdit,
          token: editToken,
        };

    return (
      <React.Fragment>
        <ProgressIndicator isLoading={isLoading} />
        <PersonalAccessTokenAddEditModal
          cheUserId={cheUserId}
          isOpen={isAddEditOpen}
          onCloseModal={() => this.handleCloseAddEditModal()}
          onSaveToken={(...args) => this.handleSaveToken(...args)}
          {...editTokenProps}
        />
        <PersonalAccessTokenDeleteModal
          isOpen={isDeleteOpen}
          deleteItems={deleteTokens}
          onCloseModal={() => this.handleCloseDeleteModal()}
          onDelete={(...args) => this.handleDeleteTokens(...args)}
        />
        {personalAccessTokens.length === 0 ? (
          <PersonalAccessTokenEmptyState
            isDisabled={isDisabled}
            onAddToken={(...args) => this.handleShowAddEditModal(...args)}
          />
        ) : (
          <PersonalAccessTokenList
            isDisabled={isDisabled}
            tokens={personalAccessTokens}
            onAddToken={(...args) => this.handleShowAddEditModal(...args)}
            onEditToken={(...args) => this.handleShowAddEditModal(...args)}
            onDeleteTokens={(...args) => this.handleShowDeleteModal(...args)}
          />
        )}
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  patState: state.personalAccessToken,
  cheUserId: selectCheUserId(state),
  cheUserIdError: selectCheUserIdError(state),
  cheUserIdIsLoading: selectCheUserIsLoading(state),
  personalAccessTokens: selectPersonalAccessTokens(state),
  personalAccessTokensError: selectPersonalAccessTokensError(state),
  personalAccessTokensIsLoading: selectPersonalAccessTokensIsLoading(state),
});

const connector = connect(
  mapStateToProps,
  { ...PersonalAccessTokenStore.actionCreators, ...UserIdStore.actionCreators },
  null,
  {
    // forwardRef is mandatory for using `@react-mock/state` in unit tests
    forwardRef: true,
  },
);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(PersonalAccessTokens);
