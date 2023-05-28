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
const MAX_LENGTH_ERROR = `The Provider Username is too long. The maximum length is ${MAX_LENGTH} characters.`;
const REQUIRED_ERROR = 'This field is required.';

export type Props = {
  providerUsername: string | undefined;
  onChange: (providerUsername: string, isValid: boolean) => void;
};

export type State = {
  providerUsername: string | undefined;
  validated: ValidatedOptions;
};

export class GitProviderUsername extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    const providerUsername = this.props.providerUsername;
    const validated = ValidatedOptions.default;

    this.state = { providerUsername: providerUsername, validated };
  }

  private onChange(providerUsername: string): void {
    const { onChange } = this.props;
    const validated = this.validate(providerUsername);
    const isValid = validated === ValidatedOptions.success;

    this.setState({ providerUsername, validated });
    onChange(providerUsername, isValid);
  }

  private validate(providerUsername: string): ValidatedOptions {
    if (providerUsername.length > MAX_LENGTH) {
      return ValidatedOptions.error;
    } else if (providerUsername.length === 0) {
      return ValidatedOptions.error;
    } else {
      return ValidatedOptions.success;
    }
  }

  public render(): React.ReactElement {
    const { providerUsername = '', validated } = this.state;
    const errorMessage = providerUsername.length === 0 ? REQUIRED_ERROR : MAX_LENGTH_ERROR;

    return (
      <FormGroup
        label="Git Provider Username"
        fieldId="git-provider-username-label"
        isRequired
        helperTextInvalid={errorMessage}
        validated={validated}
      >
        <TextInput
          aria-describedby="git-provider-username-label"
          aria-label="Git Provider Username"
          placeholder="Enter a Git Provider Username"
          onChange={providerUsername => this.onChange(providerUsername)}
          type={TextInputTypes.text}
          value={providerUsername}
        />
      </FormGroup>
    );
  }
}
