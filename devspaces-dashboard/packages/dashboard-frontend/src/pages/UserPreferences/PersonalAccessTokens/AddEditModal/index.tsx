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
import { Button, ButtonVariant, Modal, ModalVariant } from '@patternfly/react-core';
import React from 'react';
import { AddEditModalForm } from './Form';
import { EditTokenProps } from '../types';

export type Props = EditTokenProps & {
  cheUserId: string;
  isOpen: boolean;
  onSaveToken: (token: api.PersonalAccessToken) => void;
  onCloseModal: () => void;
};
export type State = {
  token: api.PersonalAccessToken | undefined;
  isSaveEnabled: boolean;
};

export class PersonalAccessTokenAddEditModal extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      token: props.token,
      // initially disabled until something changes and form is valid
      isSaveEnabled: false,
    };
  }

  public componentDidUpdate(prevProps: Props): void {
    if (
      prevProps.token?.tokenName !== this.props.token?.tokenName ||
      prevProps.isOpen !== this.props.isOpen
    ) {
      this.setState({
        token: this.props.token,
        isSaveEnabled: false,
      });
    }
  }

  private handleSaveToken(): void {
    const { token } = this.state;
    if (token) {
      this.props.onSaveToken(token);
    }
  }

  private handleCloseModal(): void {
    this.props.onCloseModal();
  }

  private handleChangeToken(token: api.PersonalAccessToken, isValid: boolean): void {
    this.setState({
      token,
      isSaveEnabled: isValid,
    });
  }

  private buildModalFooter(): React.ReactNode {
    const { isEdit } = this.props;
    const isDisabled = this.state.isSaveEnabled === false;

    return (
      <React.Fragment>
        <Button
          variant={ButtonVariant.primary}
          isDisabled={isDisabled}
          onClick={() => this.handleSaveToken()}
        >
          {isEdit ? 'Save' : 'Add'}
        </Button>
        <Button variant={ButtonVariant.link} onClick={() => this.handleCloseModal()}>
          Cancel
        </Button>
      </React.Fragment>
    );
  }

  public render(): React.ReactElement {
    const { cheUserId, isEdit, isOpen } = this.props;

    const modalTitle = isEdit ? 'Edit Personal Access Token' : 'Add Personal Access Token';
    const modalFooter = this.buildModalFooter();

    const editTokenProps: EditTokenProps =
      isEdit === true
        ? {
            isEdit: this.props.isEdit,
            token: this.props.token,
          }
        : {
            isEdit: this.props.isEdit,
            token: this.props.token,
          };

    return (
      <Modal
        aria-label={modalTitle}
        title={modalTitle}
        variant={ModalVariant.small}
        isOpen={isOpen}
        onClose={() => this.handleCloseModal()}
        footer={modalFooter}
      >
        <AddEditModalForm
          cheUserId={cheUserId}
          onChange={(...args) => this.handleChangeToken(...args)}
          {...editTokenProps}
        />
      </Modal>
    );
  }
}
