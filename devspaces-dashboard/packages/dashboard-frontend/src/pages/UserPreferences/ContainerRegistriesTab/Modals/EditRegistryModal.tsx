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

import {
  Button,
  ButtonVariant,
  Form,
  Modal,
  ModalVariant,
  ValidatedOptions,
} from '@patternfly/react-core';
import React from 'react';

import { RegistryPasswordFormGroup } from '@/pages/UserPreferences/ContainerRegistriesTab/RegistryPassword';
import { RegistryUrlFormGroup } from '@/pages/UserPreferences/ContainerRegistriesTab/RegistryUrl';
import { RegistryUsernameFormGroup } from '@/pages/UserPreferences/ContainerRegistriesTab/RegistryUsername';
import { RegistryEntry } from '@/store/DockerConfig/types';

type Props = {
  registry: RegistryEntry;
  isEditMode: boolean;
  isOpen: boolean;
  onChange: (registry: RegistryEntry) => void;
  onCancel: () => void;
};
type State = {
  editRegistry: RegistryEntry;
  urlValid: ValidatedOptions;
  usernameValid: ValidatedOptions;
  passwordValid: ValidatedOptions;
};

export default class EditRegistryModal extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    const { registry } = this.props;

    this.state = {
      editRegistry: registry,
      urlValid: ValidatedOptions.default,
      usernameValid: ValidatedOptions.default,
      passwordValid: ValidatedOptions.default,
    };
  }

  public componentDidUpdate(prevProps: Props): void {
    const { isOpen, registry } = this.props;
    if (isOpen !== prevProps.isOpen || registry.url !== prevProps.registry.url) {
      this.setState({
        editRegistry: registry,
        urlValid: ValidatedOptions.default,
        usernameValid: ValidatedOptions.default,
        passwordValid: ValidatedOptions.default,
      });
    }
  }

  private handleRegistryChange(): void {
    const { onChange } = this.props;
    const { editRegistry } = this.state;
    onChange(editRegistry);
  }

  private handleUrlChange(url: string, valid: ValidatedOptions): void {
    const { editRegistry, urlValid } = this.state;
    if (editRegistry.url !== url) {
      this.setState({
        editRegistry: Object.assign({}, editRegistry, { url }),
        urlValid: valid,
      });
    } else if (urlValid !== valid) {
      this.setState({
        urlValid: valid,
      });
    }
  }

  private handleUsernameChange(username: string, valid: ValidatedOptions): void {
    const { editRegistry, usernameValid } = this.state;
    if (editRegistry.username !== username) {
      this.setState({
        editRegistry: Object.assign({}, editRegistry, { username }),
        usernameValid: valid,
      });
    } else if (usernameValid !== valid) {
      this.setState({
        usernameValid: valid,
      });
    }
  }

  private handlePasswordChange(password: string, valid: ValidatedOptions): void {
    const { editRegistry, passwordValid } = this.state;
    if (editRegistry.password !== password) {
      this.setState({
        editRegistry: Object.assign({}, editRegistry, { password }),
        passwordValid: valid,
      });
    } else if (passwordValid !== valid) {
      this.setState({
        passwordValid: valid,
      });
    }
  }

  private get isUrlChange(): boolean {
    return this.props.registry.url !== this.state.editRegistry.url;
  }

  private get isUsernameChange(): boolean {
    return this.props.registry.username !== this.state.editRegistry.username;
  }

  private get isPasswordChange(): boolean {
    return this.props.registry.password !== this.state.editRegistry.password;
  }

  private get isUrlValid(): boolean {
    const {
      urlValid,
      editRegistry: { url },
    } = this.state;
    return urlValid !== ValidatedOptions.error && url.length > 0;
  }

  private get isUsernameValid(): boolean {
    return this.state.usernameValid !== ValidatedOptions.error;
  }

  private get isPasswordValid(): boolean {
    const {
      passwordValid,
      editRegistry: { password },
    } = this.state;
    return (
      passwordValid !== ValidatedOptions.error && password !== undefined && password.length > 0
    );
  }

  private getRegistryModalFooter(): React.ReactNode {
    const { onCancel, isEditMode } = this.props;
    const isDisabled =
      !(this.isUrlChange || this.isUsernameChange || this.isPasswordChange) ||
      !this.isUrlValid ||
      !this.isUsernameValid ||
      !this.isPasswordValid;

    return (
      <React.Fragment>
        <Button
          variant={ButtonVariant.primary}
          isDisabled={isDisabled}
          data-testid="edit-button"
          onClick={() => this.handleRegistryChange()}
        >
          {isEditMode ? 'Save' : 'Add'}
        </Button>
        <Button variant={ButtonVariant.link} data-testid="cancel-button" onClick={() => onCancel()}>
          Cancel
        </Button>
      </React.Fragment>
    );
  }

  public render(): React.ReactElement {
    const { isOpen, onCancel, isEditMode } = this.props;
    const { editRegistry } = this.state;

    return (
      <Modal
        title={`${isEditMode ? 'Edit' : 'Add'} Container Registry`}
        variant={ModalVariant.small}
        isOpen={isOpen}
        onClose={onCancel}
        aria-label="edit-registry-info"
        footer={this.getRegistryModalFooter()}
      >
        <Form isHorizontal onSubmit={e => e.preventDefault()}>
          <RegistryUrlFormGroup
            url={editRegistry.url}
            onChange={(url: string, valid: ValidatedOptions) => this.handleUrlChange(url, valid)}
          />
          <RegistryUsernameFormGroup
            username={editRegistry.username}
            onChange={(username: string, valid: ValidatedOptions) =>
              this.handleUsernameChange(username, valid)
            }
          />
          <RegistryPasswordFormGroup
            password={editRegistry.password}
            onChange={(password: string, valid: ValidatedOptions) =>
              this.handlePasswordChange(password, valid)
            }
          />
        </Form>
      </Modal>
    );
  }
}
