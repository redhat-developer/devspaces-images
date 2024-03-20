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
} from '@patternfly/react-core';
import React from 'react';

import { GIT_OAUTH_PROVIDERS } from '@/pages/UserPreferences/const';
import { IGitOauth } from '@/store/GitOauthConfig/types';

export type Props = {
  selectedItems: IGitOauth[];
  isOpen: boolean;
  onRevoke: () => void;
  onCancel: () => void;
};
type State = {
  warningInfoCheck: boolean;
};

export class GitServicesRevokeModal extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = { warningInfoCheck: false };
  }

  private handleRevoke(): void {
    this.setState({ warningInfoCheck: false });
    this.props.onRevoke();
  }

  private handleCancel(): void {
    this.setState({ warningInfoCheck: false });
    this.props.onCancel();
  }

  private handleCheckboxChange(): void {
    this.setState({ warningInfoCheck: !this.state.warningInfoCheck });
  }

  private getRevokeModalContent(): React.ReactNode {
    const { selectedItems } = this.props;

    let text = 'Would you like to revoke ';

    if (selectedItems.length === 1) {
      text += `git service "${GIT_OAUTH_PROVIDERS[selectedItems[0].name]}"`;
    } else {
      text += `${selectedItems.length} git services`;
    }
    text += '?';

    return (
      <TextContent data-testid="revoke-modal-content">
        <Text>{text}</Text>
        <Checkbox
          data-testid="warning-info-checkbox"
          isChecked={this.state.warningInfoCheck}
          onChange={() => this.handleCheckboxChange()}
          id="revoke-warning-info-check"
          label="I understand, this operation cannot be reverted."
        />
      </TextContent>
    );
  }

  public render(): React.ReactElement {
    const { isOpen, selectedItems } = this.props;
    const { warningInfoCheck } = this.state;

    const title = `Revoke Git ${selectedItems.length === 1 ? 'Service' : 'Services'}`;

    return (
      <Modal
        title={title}
        titleIconVariant="warning"
        variant={ModalVariant.small}
        isOpen={isOpen}
        /* c8 ignore next 1 */
        onClose={() => this.handleCancel()}
        aria-label="Revoke Git Services Modal"
        footer={
          <React.Fragment>
            <Button
              variant={ButtonVariant.danger}
              isDisabled={!warningInfoCheck}
              data-testid="revoke-button"
              onClick={() => this.handleRevoke()}
            >
              Revoke
            </Button>
            <Button
              variant={ButtonVariant.link}
              data-testid="cancel-button"
              onClick={() => this.handleCancel()}
            >
              Cancel
            </Button>
          </React.Fragment>
        }
      >
        {this.getRevokeModalContent()}
      </Modal>
    );
  }
}
