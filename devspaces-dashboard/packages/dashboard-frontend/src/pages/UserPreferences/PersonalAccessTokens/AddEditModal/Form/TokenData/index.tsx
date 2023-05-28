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

import { FormGroup, TextArea, TextInputTypes, ValidatedOptions } from '@patternfly/react-core';
import React from 'react';

const REQUIRED_ERROR = 'This field is required.';

export type Props = {
  isEdit: boolean;
  tokenData: string | undefined;
  onChange: (tokenData: string, isValid: boolean) => void;
};

export type State = {
  tokenData: string | undefined;
  validated: ValidatedOptions;
};

export class TokenData extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    const validated = ValidatedOptions.default;

    this.state = {
      tokenData: undefined,
      validated,
    };
  }

  private onChange(tokenData: string): void {
    const { onChange } = this.props;
    const validated = this.validate(tokenData);
    const isValid = validated === ValidatedOptions.success;

    this.setState({ tokenData, validated });
    onChange(btoa(tokenData), isValid);
  }

  private validate(tokenName: string): ValidatedOptions {
    if (tokenName.length === 0) {
      return ValidatedOptions.error;
    } else {
      return ValidatedOptions.success;
    }
  }

  public render(): React.ReactElement {
    const { isEdit } = this.props;
    const { tokenData = '' } = this.state;
    const errorMessage = REQUIRED_ERROR;
    const placeholder = isEdit ? 'Replace Token' : 'Enter a Token';

    // ignore the validation if it's an edit
    const validated = isEdit ? ValidatedOptions.success : this.state.validated;

    return (
      <FormGroup
        fieldId="token-data-label"
        helperTextInvalid={errorMessage}
        label="Token"
        validated={validated}
      >
        <TextArea
          aria-describedby="token-data-label"
          aria-label="Token"
          onChange={tokenData => this.onChange(tokenData)}
          placeholder={placeholder}
          type={TextInputTypes.text}
          value={tokenData}
        />
      </FormGroup>
    );
  }
}
