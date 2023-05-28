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

import { FormGroup, TextInput, TextInputTypes, ValidatedOptions } from '@patternfly/react-core';
import React from 'react';

const MAX_LENGTH = 255;
const MAX_LENGTH_ERROR = `The Token Name is too long. The maximum length is ${MAX_LENGTH} characters.`;
const REQUIRED_ERROR = 'This field is required.';
const WRONG_CHARACTERS_ERROR =
  'The Token Name must consist of lower case alphanumeric characters, "-" or ".", and must start and end with an alphanumeric character.';
const ALLOWED_CHARACTERS =
  'Alphanumeric characters, "-" or ".", starting and ending with an alphanumeric character.';

const REGEXP = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;

export type Props = {
  isEdit: boolean;
  tokenName: string | undefined;
  onChange: (tokenName: string, isValid: boolean) => void;
};

export type State = {
  tokenName: string | undefined;
  validated: ValidatedOptions;
};

export class TokenName extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    const tokenName = this.props.tokenName;
    const validated = ValidatedOptions.default;

    this.state = { tokenName, validated };
  }

  private onChange(tokenName: string): void {
    const { onChange } = this.props;
    const validated = this.validate(tokenName);
    const isValid = validated === ValidatedOptions.success;

    this.setState({ tokenName, validated });
    onChange(tokenName, isValid);
  }

  private validate(tokenName: string): ValidatedOptions {
    if (tokenName.length > MAX_LENGTH) {
      return ValidatedOptions.error;
    } else if (tokenName.length === 0) {
      return ValidatedOptions.error;
    } else if (REGEXP.test(tokenName) === false) {
      return ValidatedOptions.error;
    } else {
      return ValidatedOptions.success;
    }
  }

  public render(): React.ReactElement {
    const { isEdit } = this.props;
    const { tokenName = '', validated } = this.state;
    let errorMessage: string;
    if (tokenName.length === 0) {
      errorMessage = REQUIRED_ERROR;
    } else if (tokenName.length > MAX_LENGTH) {
      errorMessage = MAX_LENGTH_ERROR;
    } else if (REGEXP.test(tokenName) === false) {
      errorMessage = WRONG_CHARACTERS_ERROR;
    } else {
      errorMessage = '';
    }

    const readOnlyAttr = isEdit ? { isReadOnly: true } : {};
    const helperText = isEdit ? {} : { helperText: ALLOWED_CHARACTERS };

    return (
      <FormGroup
        fieldId="token-name-label"
        helperTextInvalid={errorMessage}
        isRequired
        label="Token Name"
        validated={validated}
        {...helperText}
      >
        <TextInput
          aria-describedby="token-name-label"
          aria-label="Token Name"
          isRequired
          onChange={tokenName => this.onChange(tokenName)}
          placeholder="Enter a Token Name"
          type={TextInputTypes.text}
          value={tokenName}
          {...readOnlyAttr}
        />
      </FormGroup>
    );
  }
}
