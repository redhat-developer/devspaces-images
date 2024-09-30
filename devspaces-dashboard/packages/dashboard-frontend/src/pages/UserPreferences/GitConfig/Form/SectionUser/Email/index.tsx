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
  validated: ValidatedOptions | undefined;
  value: string | undefined;
};

export class GitConfigUserEmail extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      validated: ValidatedOptions.default,
      value: props.value,
    };
  }

  public componentDidUpdate(_prevProps: Readonly<Props>, prevState: Readonly<State>): void {
    if (prevState.value === this.state.value && this.props.value !== this.state.value) {
      // reset the initial value
      this.setState({
        value: this.props.value,
        validated: ValidatedOptions.default,
      });
    }
  }

  private handleChange(value: string): void {
    const validate = this.validate(value);
    const isValid = validate === ValidatedOptions.success;

    this.setState({
      value,
      validated: validate,
    });
    this.props.onChange(value, isValid);
  }

  private validate(value: string): ValidatedOptions {
    if (value.length === 0) {
      return ValidatedOptions.error;
    }
    if (value.length > MAX_LENGTH) {
      return ValidatedOptions.error;
    }
    if (!REGEX.test(value)) {
      return ValidatedOptions.error;
    }
    return ValidatedOptions.success;
  }

  public render(): React.ReactElement {
    const { isLoading } = this.props;
    const { value = '', validated } = this.state;

    let errorMessage: string;
    if (value.length === 0) {
      errorMessage = ERROR_REQUIRED_VALUE;
    } else if (value.length > MAX_LENGTH) {
      errorMessage = ERROR_MAX_LENGTH;
    } else if (!REGEX.test(value)) {
      errorMessage = ERROR_INVALID_EMAIL;
    } else {
      errorMessage = '';
    }

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
