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

import ProgressIndicator from '@/components/Progress';
import { lazyInject } from '@/inversify.config';
import { SshKeysAddModal } from '@/pages/UserPreferences/SshKeys/AddModal';
import { SshKeysDeleteModal } from '@/pages/UserPreferences/SshKeys/DeleteModal';
import { SshKeysEmptyState } from '@/pages/UserPreferences/SshKeys/EmptyState';
import { SshKeysList } from '@/pages/UserPreferences/SshKeys/List';
import { AppAlerts } from '@/services/alerts/appAlerts';
import { AppState } from '@/store';
import * as SshKeysStore from '@/store/SshKeys';
import {
  selectSshKeys,
  selectSshKeysError,
  selectSshKeysIsLoading,
} from '@/store/SshKeys/selectors';
import * as UserIdStore from '@/store/User/Id';

export type Props = MappedProps;
export type State = {
  isAddOpen: boolean;
  isDeleteOpen: boolean;
  deleteKeys: api.SshKey[];
  isDeleting: boolean;
};

class SshKeys extends React.PureComponent<Props, State> {
  @lazyInject(AppAlerts)
  private readonly appAlerts: AppAlerts;

  constructor(props: Props) {
    super(props);

    this.state = {
      isAddOpen: false,
      isDeleteOpen: false,
      deleteKeys: [],
      isDeleting: false,
    };
  }

  public async componentDidMount(): Promise<void> {
    const { sshKeysIsLoading, requestSshKeys } = this.props;
    if (sshKeysIsLoading === true) {
      return;
    }

    try {
      await requestSshKeys();
    } catch (e) {
      console.error(e);
    }
  }

  public componentDidUpdate(prevProps: Props): void {
    const { sshKeysError } = this.props;
    if (sshKeysError && sshKeysError !== prevProps.sshKeysError) {
      this.appAlerts.showAlert({
        key: 'ssh-keys-error',
        title: helpers.errors.getMessage(sshKeysError),
        variant: AlertVariant.danger,
      });
    }
  }

  private handleShowAddModal(): void {
    this.setState({
      isAddOpen: true,
    });
  }

  private handleCloseAddModal(): void {
    this.setState({
      isAddOpen: false,
    });
  }

  private handleShowDeleteModal(deleteKeys: api.SshKey[]): void {
    this.setState({
      isDeleteOpen: true,
      deleteKeys,
    });
  }

  private handleCloseDeleteModal(): void {
    this.setState({
      isDeleteOpen: false,
    });
  }

  private async handleSaveSshKey(sshKey: api.NewSshKey): Promise<void> {
    this.setState({
      isAddOpen: false,
    });

    try {
      await this.props.addSshKey(sshKey);

      this.appAlerts.showAlert({
        key: 'save-ssh-keys-success',
        title: 'SSH keys saved successfully.',
        variant: AlertVariant.success,
      });
    } catch (error) {
      console.error('Failed to save SSH keys. ', error);
    }
  }

  private async handleDeleteSshKey(deleteSshKeys: api.SshKey[]): Promise<void> {
    this.setState({
      isDeleteOpen: false,
      isDeleting: true,
    });

    const promises = deleteSshKeys.map(async sshKey => {
      try {
        return await this.props.removeSshKey(sshKey);
      } catch (error) {
        console.error('Failed to delete SSH keys. ', error);
        throw error;
      }
    });
    const results = await Promise.allSettled(promises);

    this.setState({
      isDeleting: false,
    });

    const failedNumber = results.filter(result => result.status === 'rejected').length;
    const failedPairs = pluralize(failedNumber, 'pair');

    const successNumber = results.filter(result => result.status === 'fulfilled').length;
    const successPairs = pluralize(successNumber, 'pair');

    const allPairs = pluralize(deleteSshKeys.length, 'pair');

    if (successNumber === deleteSshKeys.length) {
      this.appAlerts.showAlert({
        key: 'delete-ssh-keys-success',
        title: `${successPairs} of SSH keys deleted successfully.`,
        variant: AlertVariant.success,
      });
    } else {
      this.appAlerts.showAlert({
        key: 'delete-ssh-keys-success',
        title: `${successNumber} of ${allPairs} of SSH keys deleted successfully.`,
        variant: AlertVariant.success,
      });
      this.appAlerts.showAlert({
        key: 'delete-ssh-keys-error',
        title: `Failed to delete ${failedPairs} of SSH keys.`,
        variant: AlertVariant.danger,
      });
    }
  }

  public render(): React.ReactElement {
    const { sshKeys, sshKeysIsLoading } = this.props;
    const { isAddOpen, isDeleteOpen, deleteKeys, isDeleting } = this.state;

    const isLoading = sshKeysIsLoading;
    const isDisabled = isLoading || isDeleting;
    const showEmptyState = sshKeys.length === 0 && !isLoading;
    const showList = sshKeys.length !== 0;

    return (
      <React.Fragment>
        <ProgressIndicator isLoading={isLoading} />
        <SshKeysAddModal
          isOpen={isAddOpen}
          onCloseModal={() => this.handleCloseAddModal()}
          onSaveSshKey={(...args) => this.handleSaveSshKey(...args)}
        />
        <SshKeysDeleteModal
          isOpen={isDeleteOpen}
          deleteItems={deleteKeys}
          onCloseModal={() => this.handleCloseDeleteModal()}
          onDelete={(...args) => this.handleDeleteSshKey(...args)}
        />
        {showEmptyState && (
          <SshKeysEmptyState
            isDisabled={isDisabled}
            onAddSshKey={(...args) => this.handleShowAddModal(...args)}
          />
        )}
        {showList && (
          <SshKeysList
            sshKeys={sshKeys}
            onDeleteSshKeys={(...args) => this.handleShowDeleteModal(...args)}
          />
        )}
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  sshKeys: selectSshKeys(state),
  sshKeysError: selectSshKeysError(state),
  sshKeysIsLoading: selectSshKeysIsLoading(state),
});

const connector = connect(
  mapStateToProps,
  { ...SshKeysStore.actionCreators, ...UserIdStore.actionCreators },
  null,
  {
    // forwardRef is mandatory for using `@react-mock/state` in unit tests
    forwardRef: true,
  },
);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(SshKeys);
