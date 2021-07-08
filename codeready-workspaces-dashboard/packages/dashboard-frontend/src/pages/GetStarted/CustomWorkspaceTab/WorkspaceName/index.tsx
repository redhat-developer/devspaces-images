/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
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
import { FormGroup, TextInput, ValidatedOptions } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

import styles from './index.module.css';

const MIN_LENGTH = 3;
const MAX_LENGTH = 100;
const PATTERN = `^(?:[a-zA-Z0-9][-_.a-zA-Z0-9]{1,${MAX_LENGTH - 2}}[a-zA-Z0-9])?$`;
const DEFAULT_PLACEHOLDER = 'Enter a workspace name';
const ERROR_REQUIRED_VALUE = 'A value is required.';
const ERROR_MIN_LENGTH = `The name has to be at least ${MIN_LENGTH} characters long.`;
const ERROR_MAX_LENGTH = `The name is too long. The maximum length is ${MAX_LENGTH} characters.`;
const ERROR_PATTERN_MISMATCH = 'The name can contain digits, latin letters, underscores and it should not contain special characters like space, dollar, etc. It should start and end only with digit or latin letter.';

type Props = {
  generateName?: string;
  name: string;
  onChange: (name: string) => void;
};

type State = {
  errorMessage?: string;
  generateName?: string;
  name: string;
  placeholder: string;
  validated: ValidatedOptions;
};

export class WorkspaceNameFormGroup extends React.PureComponent<Props, State> {

  constructor(props: Props) {
    super(props);

    this.state = {
      name: this.props.name,
      generateName: this.props.generateName,
      validated: ValidatedOptions.default,
      placeholder: DEFAULT_PLACEHOLDER,
    };
  }

  private handleChange(name: string): void {
    this.setState({
      name,
    });
    this.props.onChange(name);

    this.validate(name);
  }

  private validate(name: string): void {
    if (name.length === 0 && !this.props.generateName) {
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
      validated: ValidatedOptions.default,
    });
  }

  public componentDidUpdate(prevProps: Props): void {
    if (prevProps.name !== this.props.name) {
      this.validate(this.props.name);
      this.setState({
        name: this.props.name,
      });
    }

    if (prevProps.generateName !== this.props.generateName) {
      this.setState({
        generateName: this.props.generateName,
      });
    }
  }

  public render(): React.ReactElement {
    const { name, generateName, errorMessage, validated } = this.state;
    const isRequired = !generateName;

    let placeholder: string;
    if (isRequired) {
      placeholder = DEFAULT_PLACEHOLDER;
    } else {
      placeholder = `will be auto-generated with the prefix "${this.props.generateName}"`;
    }

    const fieldId = 'workspace-name';
    return (
      <FormGroup
        label="Workspace Name"
        isRequired={isRequired}
        fieldId={fieldId}
        helperTextInvalid={errorMessage}
        helperTextInvalidIcon={<ExclamationCircleIcon />}
        validated={validated}
      >
        <TextInput
          className={styles.workspaceName}
          value={name}
          isRequired
          type="text"
          id={fieldId}
          aria-describedby="workspace-name-helper"
          name="workspace-name"
          onChange={_name => this.handleChange(_name)}
          minLength={MIN_LENGTH}
          maxLength={MAX_LENGTH}
          placeholder={placeholder}
          validated={validated}
        />
      </FormGroup>
    );
  }

}
