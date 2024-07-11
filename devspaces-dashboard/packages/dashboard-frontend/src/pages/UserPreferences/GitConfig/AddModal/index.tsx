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

import { Button, ButtonVariant, Modal, ModalVariant } from '@patternfly/react-core';
import isEqual from 'lodash/isEqual';
import React from 'react';

import { GitConfigForm } from '@/pages/UserPreferences/GitConfig/AddModal/GitConfigForm';
import * as GitConfigStore from '@/store/GitConfig';

export type Props = {
  gitConfig: GitConfigStore.GitConfig | undefined;
  isOpen: boolean;
  onSave: (gitConfig: GitConfigStore.GitConfig) => Promise<void>;
  onCloseModal: () => void;
};
export type State = {
  gitConfig: GitConfigStore.GitConfig | undefined;
  isSaveEnabled: boolean;
};

export class GitConfigAddModal extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      gitConfig: undefined,
      // initially disabled until something changes and form is valid
      isSaveEnabled: false,
    };
  }

  private handleSaveGitConfig(): void {
    const { gitConfig } = this.state;

    if (gitConfig) {
      this.props.onSave(gitConfig);
    }
  }

  private handleCloseModal(): void {
    this.props.onCloseModal();
  }

  private handleChangeGitConfig(
    gitConfig: GitConfigStore.GitConfig | undefined,
    isValid: boolean,
  ): void {
    const isSaveEnabled =
      isValid && gitConfig !== undefined && !isEqual(this.props.gitConfig, gitConfig);
    this.setState({
      gitConfig,
      isSaveEnabled,
    });
  }

  private buildModalFooter(): React.ReactNode {
    return (
      <React.Fragment>
        <Button
          variant={ButtonVariant.primary}
          isDisabled={!this.state.isSaveEnabled}
          onClick={() => this.handleSaveGitConfig()}
        >
          Add
        </Button>
        <Button variant={ButtonVariant.link} onClick={() => this.handleCloseModal()}>
          Cancel
        </Button>
      </React.Fragment>
    );
  }

  public render(): React.ReactElement {
    const { isOpen } = this.props;

    const modalTitle = 'Import Git Configuration';
    const modalFooter = this.buildModalFooter();

    return (
      <Modal
        aria-label={modalTitle}
        title={modalTitle}
        variant={ModalVariant.small}
        isOpen={isOpen}
        onClose={() => this.handleCloseModal()}
        footer={modalFooter}
      >
        <GitConfigForm
          gitConfig={this.props.gitConfig}
          onChange={(gitConfig, isValid) => this.handleChangeGitConfig(gitConfig, isValid)}
        />
      </Modal>
    );
  }
}
