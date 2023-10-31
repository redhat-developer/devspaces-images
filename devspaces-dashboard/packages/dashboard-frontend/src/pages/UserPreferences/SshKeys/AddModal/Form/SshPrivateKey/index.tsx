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

import { FormGroup, ValidatedOptions } from '@patternfly/react-core';
import React from 'react';

import { TextFileUpload } from '@/components/TextFileUpload';

const REQUIRED_ERROR = 'This field is required.';

export type Props = {
  onChange: (privateKey: string, isValid: boolean) => void;
};

export type State = {
  privateKey: string | undefined;
  validated: ValidatedOptions;
};

export class SshPrivateKey extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      privateKey: undefined,
      validated: ValidatedOptions.default,
    };
  }

  public shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>): boolean {
    const { privateKey, validated } = this.state;
    const { privateKey: nextPrivateKey, validated: nextValidated } = nextState;

    return privateKey !== nextPrivateKey || validated !== nextValidated;
  }

  private onChange(privateKey: string): void {
    const { onChange } = this.props;
    const validated = this.validate(privateKey);
    const isValid = validated === ValidatedOptions.success;

    this.setState({ privateKey, validated });
    onChange(privateKey, isValid);
  }

  private validate(privateKey: string): ValidatedOptions {
    if (privateKey.length === 0) {
      return ValidatedOptions.error;
    } else {
      return ValidatedOptions.success;
    }
  }

  public render(): React.ReactElement {
    const { validated } = this.state;
    const errorMessage = REQUIRED_ERROR;

    return (
      <FormGroup
        fieldId="ssh-private-key"
        helperTextInvalid={errorMessage}
        label="Private Key"
        validated={validated}
        required={true}
      >
        <TextFileUpload
          fieldId="ssh-private-key"
          placeholder="Paste the PRIVATE key here."
          validated={validated}
          onChange={key => this.onChange(key)}
        />
      </FormGroup>
    );
  }
}
