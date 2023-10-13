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

import { FormGroup, TextInput, ValidatedOptions } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import React from 'react';

import { InputGroupExtended } from '@/components/InputGroupExtended';

const ERROR_REQUIRED_VALUE = 'A value is required.';
const MAX_LENGTH = 128;
const ERROR_MAX_LENGTH = `The value is too long. The maximum length is ${MAX_LENGTH} characters.`;

export type Props = {
  value: string;
  onChange: (value: string) => void;
};
export type State = {
  errorMessage?: string;
  value: string;
  validated: ValidatedOptions | undefined;
};

export class GitConfigUserName extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      value: props.value,
      validated: undefined,
    };
  }

  private handleChange(value: string): void {
    this.validate(value);
    this.setState({ value });
  }

  private handleSave(): void {
    const { value } = this.state;
    this.props.onChange(value);
  }

  private handleCancel(): void {
    const { value } = this.props;
    this.setState({ value });
  }

  private validate(value: string): void {
    if (value.length === 0) {
      this.setState({
        errorMessage: ERROR_REQUIRED_VALUE,
        validated: ValidatedOptions.error,
      });
      return;
    }
    if (value.length > MAX_LENGTH) {
      this.setState({
        errorMessage: ERROR_MAX_LENGTH,
        validated: ValidatedOptions.error,
      });
      return;
    }
    this.setState({
      errorMessage: undefined,
      validated: ValidatedOptions.success,
    });
  }

  public render(): React.ReactElement {
    const { errorMessage, value, validated } = this.state;

    const fieldId = 'gitconfig-user-name';

    return (
      <FormGroup
        label="name"
        fieldId={fieldId}
        isRequired
        helperTextInvalid={errorMessage}
        helperTextIcon={<ExclamationCircleIcon />}
      >
        <InputGroupExtended
          readonly={false}
          value={value}
          validated={validated}
          onSave={() => this.handleSave()}
          onCancel={() => this.handleCancel()}
        >
          <TextInput
            id={fieldId}
            value={value}
            validated={validated}
            onChange={value => this.handleChange(value)}
            onSubmit={() => this.handleSave()}
          />
        </InputGroupExtended>
      </FormGroup>
    );
  }
}
