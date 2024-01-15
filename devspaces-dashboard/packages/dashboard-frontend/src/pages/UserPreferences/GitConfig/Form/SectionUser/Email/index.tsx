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

import { FormGroup, TextInput, ValidatedOptions } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import React from 'react';

import { InputGroupExtended } from '@/components/InputGroupExtended';

const ERROR_REQUIRED_VALUE = 'A value is required.';
const MAX_LENGTH = 128;
const ERROR_MAX_LENGTH = `The value is too long. The maximum length is ${MAX_LENGTH} characters.`;
const REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const ERROR_INVALID_EMAIL = 'The value is not a valid email address.';

export type Props = {
  isLoading: boolean;
  value: string;
  onChange: (value: string, isValid: boolean) => void;
};
export type State = {
  errorMessage?: string;
  validated: ValidatedOptions | undefined;
};

export class GitConfigUserEmail extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      validated: undefined,
    };
  }

  public componentDidMount(): void {
    const { value } = this.props;
    this.validate(value, true);
  }

  public componentDidUpdate(prevProps: Readonly<Props>): void {
    const { value } = this.props;
    if (value !== prevProps.value) {
      this.validate(value, true);
    }
  }

  private handleChange(value: string): void {
    const isValid = this.validate(value);
    this.props.onChange(value, isValid);
  }

  private validate(value: string, initial = false): boolean {
    if (value.length === 0) {
      this.setState({
        errorMessage: ERROR_REQUIRED_VALUE,
        validated: ValidatedOptions.error,
      });
      return false;
    }
    if (value.length > MAX_LENGTH) {
      this.setState({
        errorMessage: ERROR_MAX_LENGTH,
        validated: ValidatedOptions.error,
      });
      return false;
    }
    if (!REGEX.test(value)) {
      this.setState({
        errorMessage: ERROR_INVALID_EMAIL,
        validated: ValidatedOptions.error,
      });
      return false;
    }
    this.setState({
      errorMessage: undefined,
      validated: initial === true ? ValidatedOptions.default : ValidatedOptions.success,
    });
    return true;
  }

  public render(): React.ReactElement {
    const { isLoading, value } = this.props;
    const { errorMessage, validated } = this.state;

    const fieldId = 'gitconfig-user-email';

    return (
      <FormGroup
        label="email"
        fieldId={fieldId}
        isRequired
        helperTextInvalid={errorMessage}
        helperTextIcon={<ExclamationCircleIcon />}
        validated={validated}
      >
        <InputGroupExtended
          isLoading={isLoading}
          readonly={false}
          required={true}
          validated={validated}
          value={value}
          onRemove={undefined}
        >
          <TextInput
            id={fieldId}
            isDisabled={isLoading}
            validated={validated}
            value={value}
            onChange={value => this.handleChange(value)}
          />
        </InputGroupExtended>
      </FormGroup>
    );
  }
}
