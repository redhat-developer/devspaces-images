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
import React from 'react';

const MAX_LENGTH = 100;
const ERROR_MAX_LENGTH = `The username is too long. The maximum length is ${MAX_LENGTH} characters.`;

type Props = {
  username?: string;
  onChange?: (username: string, valid: ValidatedOptions) => void;
};

type State = {
  errorMessage?: string;
  username: string;
  valid: ValidatedOptions;
};

export class RegistryUsernameFormGroup extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    const username = this.props.username || '';
    const valid = ValidatedOptions.default;

    this.state = { username, valid };
  }

  public componentDidUpdate(prevProps: Props): void {
    const username = this.props.username || '';
    if (prevProps.username !== username) {
      this.setState({ username });
    }
  }

  private onChange(username: string): void {
    if (this.state.username === username) {
      return;
    }
    const { onChange } = this.props;
    const { errorMessage, valid } = this.validate(username);

    this.setState({ username, valid, errorMessage });
    if (onChange) {
      onChange(username, valid);
    }
  }

  private validate(username: string): { valid: ValidatedOptions; errorMessage?: string } {
    if (username.length > MAX_LENGTH) {
      return {
        errorMessage: ERROR_MAX_LENGTH,
        valid: ValidatedOptions.error,
      };
    }

    return {
      errorMessage: undefined,
      valid: ValidatedOptions.success,
    };
  }

  public render(): React.ReactElement {
    const { username, errorMessage, valid } = this.state;

    return (
      <FormGroup
        style={{ gridTemplateColumns: '80px', minHeight: '65px' }}
        label="Username"
        fieldId="id-username-helper"
        helperTextInvalid={errorMessage}
        validated={valid}
      >
        <TextInput
          aria-label="Username input"
          placeholder="Enter a username"
          value={username}
          validated={valid}
          onChange={_username => this.onChange(_username)}
        />
      </FormGroup>
    );
  }
}
