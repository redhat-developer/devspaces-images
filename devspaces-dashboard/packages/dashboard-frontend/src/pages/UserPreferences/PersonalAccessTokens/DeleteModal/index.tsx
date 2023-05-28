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
  Button,
  ButtonVariant,
  Checkbox,
  Modal,
  ModalVariant,
  pluralize,
  Text,
  TextContent,
} from '@patternfly/react-core';
import React from 'react';

export type Props = {
  isOpen: boolean;
  deleteItems: api.PersonalAccessToken[];
  onCloseModal: () => void;
  onDelete: (tokens: api.PersonalAccessToken[]) => void;
};
export type State = {
  isChecked: boolean;
};

export class PersonalAccessTokenDeleteModal extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isChecked: false,
    };
  }

  private handleDelete(): void {
    this.setState({ isChecked: false });
    this.props.onDelete(this.props.deleteItems);
  }

  private handleCloseModal(): void {
    this.setState({ isChecked: false });
    this.props.onCloseModal();
  }

  private buildModalFooter(): React.ReactElement {
    const { isChecked } = this.state;

    return (
      <React.Fragment>
        <Button
          variant={ButtonVariant.danger}
          isDisabled={isChecked === false}
          onClick={() => this.handleDelete()}
        >
          Delete
        </Button>
        <Button variant={ButtonVariant.link} onClick={() => this.handleCloseModal()}>
          Cancel
        </Button>
      </React.Fragment>
    );
  }

  private buildModalContent(): React.ReactElement {
    const { deleteItems } = this.props;
    const { isChecked } = this.state;

    const tokens = pluralize(deleteItems.length, 'token');

    return (
      <TextContent>
        <Text>Are you sure you want to delete the selected {tokens}?</Text>
        <Checkbox
          id="delete-tokens-warning-checkbox"
          isChecked={isChecked}
          label="I understand, this operation cannot be reverted."
          onChange={isChecked => this.setState({ isChecked })}
        />
      </TextContent>
    );
  }

  public render(): React.ReactElement {
    const { isOpen, deleteItems } = this.props;

    const tokens = pluralize(deleteItems.length, 'token');
    const modalTitle = `Delete Personal Access ${tokens}`;
    const modalFooter = this.buildModalFooter();
    const modalContent = this.buildModalContent();

    return (
      <Modal
        aria-label={modalTitle}
        title={modalTitle}
        titleIconVariant="warning"
        variant={ModalVariant.small}
        isOpen={isOpen}
        onClose={() => this.handleCloseModal()}
        footer={modalFooter}
      >
        {modalContent}
      </Modal>
    );
  }
}
