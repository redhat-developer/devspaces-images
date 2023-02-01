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
import { api } from '@eclipse-che/common';
import { providersMap } from '../index';

type Props = {
  gitOauth?: api.GitOauthProvider;
  selectedItems: api.GitOauthProvider[];
  isOpen: boolean;
  onRevoke: () => void;
  onCancel: () => void;
};
type State = {
  warningInfoCheck: boolean;
};

export default class RevokeGitServicesModal extends React.PureComponent<Props, State> {
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

  private getRevokeModalContent(): React.ReactNode {
    const { gitOauth, selectedItems } = this.props;

    let text = 'Would you like to revoke ';

    if (gitOauth) {
      text += `git service '${providersMap[gitOauth]}'`;
    } else {
      if (selectedItems.length === 1) {
        text += `git service '${providersMap[selectedItems[0]]}'`;
      } else {
        text += `${selectedItems.length} git services`;
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
          id="revoke-warning-info-check"
          label="I understand, this operation cannot be reverted."
        />
      </TextContent>
    );
  }

  public render(): React.ReactElement {
    const { isOpen, onCancel, onRevoke, gitOauth } = this.props;
    const { warningInfoCheck } = this.state;

    return (
      <Modal
        title={`Revoke Git Servic${gitOauth !== undefined ? 'e' : 'es'}`}
        titleIconVariant="warning"
        variant={ModalVariant.small}
        isOpen={isOpen}
        onClose={() => onCancel()}
        aria-label="warning-info"
        footer={
          <React.Fragment>
            <Button
              variant={ButtonVariant.danger}
              isDisabled={!warningInfoCheck}
              data-testid="revoke-button"
              onClick={() => onRevoke()}
            >
              Revoke
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
        {this.getRevokeModalContent()}
      </Modal>
    );
  }
}
