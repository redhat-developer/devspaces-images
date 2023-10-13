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
  FormGroup,
  InputGroupText,
  TextInput,
  ValidatedOptions,
} from '@patternfly/react-core';
import { ExclamationCircleIcon, EyeIcon, EyeSlashIcon } from '@patternfly/react-icons';
import React from 'react';

const MAX_LENGTH = 10000;
const ERROR_REQUIRED_VALUE = 'A value is required.';
const ERROR_MAX_LENGTH = `The password is too long. The maximum length is ${MAX_LENGTH} characters.`;

type Props = {
  password?: string;
  onChange?: (password: string, valid: ValidatedOptions) => void;
};

type State = {
  password: string;
  isHidden: boolean;
  errorMessage?: string;
  valid: ValidatedOptions;
};

export class RegistryPasswordFormGroup extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    const password = this.props.password || '';
    const valid = ValidatedOptions.default;
    const isHidden = true;

    this.state = { password, valid, isHidden };
  }

  public componentDidUpdate(prevProps: Props): void {
    const password = this.props.password || '';
    if (prevProps.password !== password) {
      this.setState({ password });
    }
  }

  private onChange(password: string): void {
    if (this.state.password === password) {
      return;
    }
    const { onChange } = this.props;
    const { errorMessage, valid } = this.validate(password);

    this.setState({ password, valid, errorMessage });
    if (onChange) {
      onChange(password, valid);
    }
  }

  private validate(password: string): { valid: ValidatedOptions; errorMessage?: string } {
    if (password.length === 0) {
      return {
        errorMessage: ERROR_REQUIRED_VALUE,
        valid: ValidatedOptions.error,
      };
    } else if (password.length > MAX_LENGTH) {
      return {
        errorMessage: ERROR_MAX_LENGTH,
        valid: ValidatedOptions.error,
      };
    }

    return {
      valid: ValidatedOptions.success,
    };
  }

  public render(): React.ReactElement {
    const { password, errorMessage, valid, isHidden } = this.state;

    return (
      <FormGroup
        style={{ gridTemplateColumns: '80px', minHeight: '65px' }}
        label="Password"
        fieldId="id-password-helper"
        helperTextInvalid={errorMessage}
        isRequired={true}
        helperTextInvalidIcon={<ExclamationCircleIcon />}
        validated={valid}
      >
        <InputGroupText>
          <TextInput
            data-testid="registry-password-input"
            aria-label="Password input"
            placeholder="Enter a password"
            type={isHidden ? 'password' : 'text'}
            value={password}
            validated={valid}
            onChange={_password => this.onChange(_password)}
          />
          <Button
            variant="control"
            aria-label="show"
            onClick={() => this.setState({ isHidden: !isHidden })}
          >
            {isHidden ? <EyeSlashIcon /> : <EyeIcon />}
          </Button>
        </InputGroupText>
      </FormGroup>
    );
  }
}
