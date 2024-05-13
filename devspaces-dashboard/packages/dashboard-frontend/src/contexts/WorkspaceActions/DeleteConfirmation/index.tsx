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

import {
  Button,
  ButtonVariant,
  Checkbox,
  Modal,
  ModalVariant,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import React from 'react';

import { WantDelete } from '@/contexts/WorkspaceActions';

export type Props = {
  isOpen: boolean;
  wantDelete: WantDelete;
  onConfirm: () => void;
  onClose: () => void;
};
export type State = {
  isConfirmed: boolean;
};

export class WorkspaceActionsDeleteConfirmation extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isConfirmed: false,
    };
  }

  private handleConfirmationChange(isConfirmed: boolean): void {
    this.setState({ isConfirmed });
  }

  private handleConfirm(): void {
    this.handleConfirmationChange(false);
    this.props.onConfirm();
    this.props.onClose();
  }

  private handleClose(): void {
    this.handleConfirmationChange(false);
    this.props.onClose();
  }

  public render(): React.ReactElement {
    const { isOpen, wantDelete } = this.props;
    const { isConfirmed } = this.state;

    let confirmationText: string;
    if (wantDelete.length === 1) {
      const workspaceName = wantDelete[0];
      confirmationText = `Would you like to delete workspace "${workspaceName}"?`;
    } else {
      confirmationText = `Would you like to delete ${wantDelete.length} workspaces?`;
    }

    const body = (
      <TextContent>
        <Text component={TextVariants.p}>{confirmationText}</Text>
        <Checkbox
          style={{ margin: '0 0 0 0.4rem' }}
          data-testid="confirmation-checkbox"
          isChecked={this.state.isConfirmed}
          onChange={isChecked => this.handleConfirmationChange(isChecked)}
          id="confirmation-checkbox"
          label="I understand, this operation cannot be reverted."
        />
      </TextContent>
    );

    const footer = (
      <React.Fragment>
        <Button
          variant={ButtonVariant.danger}
          isDisabled={isConfirmed === false}
          data-testid="delete-workspace-button"
          onClick={() => this.handleConfirm()}
        >
          Delete
        </Button>
        <Button
          variant={ButtonVariant.link}
          data-testid="close-button"
          onClick={() => this.handleClose()}
        >
          Cancel
        </Button>
      </React.Fragment>
    );

    return (
      <Modal
        aria-label="Delete workspaces confirmation window"
        footer={footer}
        isOpen={isOpen}
        title="Delete Workspace"
        titleIconVariant="warning"
        variant={ModalVariant.small}
        onClose={() => this.handleClose()}
      >
        {body}
      </Modal>
    );
  }
}
