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

import React from 'react';
import {
  Button,
  ButtonVariant,
  ModalVariant,
  Modal,
  TextContent,
  Text,
  Checkbox,
} from '@patternfly/react-core';
import { RegistryEntry } from '../../../../store/DockerConfig/types';

type Props = {
  registry?: RegistryEntry;
  selectedItems: string[];
  isOpen: boolean;
  onDelete: (registry?: RegistryEntry) => void;
  onCancel: () => void;
};
type State = {
  warningInfoCheck: boolean;
};

export default class DeleteRegistriesModal extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = { warningInfoCheck: false };
  }

  public componentDidUpdate(prevProps: Props): void {
    if (prevProps.isOpen === this.props.isOpen && this.props.isOpen) {
      return;
    }

    this.setState({ warningInfoCheck: false });
  }

  private getDeleteModalContent(): React.ReactNode {
    const { registry, selectedItems } = this.props;

    let text = 'Would you like to delete ';

    if (registry) {
      text += `registry '${registry.url}'`;
    } else {
      if (selectedItems.length === 1) {
        text += `registry '${selectedItems[0]}'`;
      } else {
        text += `${selectedItems.length} registries`;
      }
    }
    text += '?';

    return (
      <TextContent>
        <Text>{text}</Text>
        <Checkbox
          style={{ margin: '0 0 0 0.4rem' }}
          data-testid="warning-info-checkbox"
          isChecked={this.state.warningInfoCheck}
          onChange={() => {
            this.setState({ warningInfoCheck: !this.state.warningInfoCheck });
          }}
          id="delete-warning-info-check"
          label="I understand, this operation cannot be reverted."
        />
      </TextContent>
    );
  }

  public render(): React.ReactElement {
    const { isOpen, onCancel, onDelete, registry } = this.props;
    const { warningInfoCheck } = this.state;

    return (
      <Modal
        title={`Delete Container Registr${registry !== undefined ? 'y' : 'ies'}`}
        titleIconVariant="warning"
        variant={ModalVariant.small}
        isOpen={isOpen}
        onClose={onCancel}
        aria-label="warning-info"
        footer={
          <React.Fragment>
            <Button
              variant={ButtonVariant.danger}
              isDisabled={!warningInfoCheck}
              data-testid="delete-button"
              onClick={() => onDelete(registry)}
            >
              Delete
            </Button>
            <Button
              variant={ButtonVariant.link}
              data-testid="cancel-button"
              onClick={() => onCancel()}
            >
              Cancel
            </Button>
          </React.Fragment>
        }
      >
        {this.getDeleteModalContent()}
      </Modal>
    );
  }
}
