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

import { Button, FormGroup, InputGroup, TextInput, ValidatedOptions } from '@patternfly/react-core';
import {
  CheckIcon,
  ExclamationCircleIcon,
  PencilAltIcon,
  TimesIcon,
} from '@patternfly/react-icons';
import React from 'react';

import overviewStyles from '@/pages/WorkspaceDetails/OverviewTab/index.module.css';
import workspaceNameStyles from '@/pages/WorkspaceDetails/OverviewTab/WorkspaceName/index.module.css';

const MIN_LENGTH = 3;
const MAX_LENGTH = 100;
const PATTERN = `^(?:[a-zA-Z0-9][-_.a-zA-Z0-9]{1,${MAX_LENGTH - 2}}[a-zA-Z0-9])?$`;
const ERROR_REQUIRED_VALUE = 'A value is required.';
const ERROR_MIN_LENGTH = `The name has to be at least ${MIN_LENGTH} characters long.`;
const ERROR_MAX_LENGTH = `The name is too long. The maximum length is ${MAX_LENGTH} characters.`;
const ERROR_PATTERN_MISMATCH =
  'The name can contain digits, latin letters, underscores and it should not contain special characters like space, dollar, etc. It should start and end only with digit or latin letter.';

type Props = {
  name: string;
  readonly: boolean;
  onSave: (name: string) => Promise<void>;
  onChange?: (name: string) => void;
  callbacks?: { cancelChanges?: () => void };
};

type State = {
  errorMessage?: string;
  name?: string;
  validated?: ValidatedOptions;
  isEditMode: boolean;
  hasChanges: boolean;
};

export class WorkspaceNameFormGroup extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      name: this.props.name,
      validated: ValidatedOptions.default,
      isEditMode: false,
      hasChanges: false,
    };

    if (this.props.callbacks && !this.props.callbacks.cancelChanges) {
      this.props.callbacks.cancelChanges = () => this.handleCancel();
    }
  }

  public componentDidUpdate(prevProps: Props): void {
    if (prevProps.name !== this.props.name) {
      this.validate(this.props.name);
      this.setState({
        name: this.props.name,
      });
      if (this.props.onChange) {
        this.props.onChange(this.props.name);
      }
    }
  }

  private handleEditModeToggle(): void {
    this.setState(({ isEditMode }) => ({
      isEditMode: !isEditMode,
    }));
  }

  private handleChange(name: string): void {
    const hasChanges = name !== this.state.name;
    this.setState({
      name,
      hasChanges,
    });
    this.validate(name);
    if (this.props.onChange) {
      this.props.onChange(name);
    }
  }

  private validate(name: string): void {
    if (name.length === 0) {
      this.setState({
        errorMessage: ERROR_REQUIRED_VALUE,
        validated: ValidatedOptions.error,
      });
      return;
    } else if (name.length !== 0 && name.length < MIN_LENGTH) {
      this.setState({
        errorMessage: ERROR_MIN_LENGTH,
        validated: ValidatedOptions.error,
      });
      return;
    } else if (name.length > MAX_LENGTH) {
      this.setState({
        errorMessage: ERROR_MAX_LENGTH,
        validated: ValidatedOptions.error,
      });
      return;
    }
    if (new RegExp(PATTERN).test(name) === false) {
      this.setState({
        errorMessage: ERROR_PATTERN_MISMATCH,
        validated: ValidatedOptions.error,
      });
      return;
    }

    this.setState({
      errorMessage: undefined,
      validated: ValidatedOptions.success,
    });
  }

  private async handleSave(): Promise<void> {
    if (this.state.validated === ValidatedOptions.error) {
      return;
    }
    await this.props.onSave(this.state.name as string);
    this.setState({
      validated: ValidatedOptions.default,
      hasChanges: false,
    });
    this.handleEditModeToggle();
    if (this.props.onChange) {
      this.props.onChange(this.props.name);
    }
  }

  private handleCancel(): void {
    this.setState({
      name: this.props.name,
      errorMessage: '',
      validated: ValidatedOptions.default,
      hasChanges: false,
    });
    this.handleEditModeToggle();
    if (this.props.onChange) {
      this.props.onChange(this.props.name);
    }
  }

  public render(): React.ReactElement {
    const { readonly } = this.props;
    const { name, errorMessage, validated, isEditMode } = this.state;
    const isSaveButtonDisable =
      this.state.validated === ValidatedOptions.error || !this.state.hasChanges;
    const fieldId = 'workspace-name';

    return (
      <FormGroup
        label="Workspace Name"
        isRequired={true}
        fieldId={fieldId}
        helperTextInvalid={errorMessage}
        helperTextInvalidIcon={<ExclamationCircleIcon />}
        validated={validated}
      >
        {readonly && <span className={overviewStyles.readonly}>{name}</span>}
        {!readonly && !isEditMode && (
          <span className={overviewStyles.editable}>
            {name}
            <Button
              data-testid="overview-name-edit-toggle"
              variant="plain"
              onClick={() => this.handleEditModeToggle()}
            >
              <PencilAltIcon />
            </Button>
          </span>
        )}
        {isEditMode && (
          <InputGroup className={workspaceNameStyles.nameInput}>
            <TextInput
              value={name}
              isRequired
              type="text"
              id={fieldId}
              aria-describedby="workspace-name-helper"
              name="workspace-name"
              validated={validated}
              onChange={_name => this.handleChange(_name)}
              minLength={MIN_LENGTH}
              maxLength={MAX_LENGTH}
              placeholder="Enter a workspace name"
            />
            <Button
              variant="link"
              data-testid="handle-on-save"
              isDisabled={isSaveButtonDisable}
              onClick={() => this.handleSave()}
            >
              <CheckIcon />
            </Button>
            <Button
              variant="plain"
              data-testid="handle-on-cancel"
              onClick={() => this.handleCancel()}
            >
              <TimesIcon />
            </Button>
          </InputGroup>
        )}
      </FormGroup>
    );
  }
}
