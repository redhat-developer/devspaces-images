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
  onChange: (publicKey: string, isValid: boolean) => void;
};

export type State = {
  publicKey: string | undefined;
  validated: ValidatedOptions;
};

export class SshPublicKey extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      publicKey: undefined,
      validated: ValidatedOptions.default,
    };
  }

  public shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>): boolean {
    const { publicKey, validated } = this.state;
    const { publicKey: nextPublicKey, validated: nextValidated } = nextState;

    return publicKey !== nextPublicKey || validated !== nextValidated;
  }

  private onChange(publicKey: string): void {
    const { onChange } = this.props;
    const validated = this.validate(publicKey);
    const isValid = validated === ValidatedOptions.success;

    this.setState({ publicKey, validated });
    onChange(publicKey, isValid);
  }

  private validate(publicKey: string): ValidatedOptions {
    if (publicKey.length === 0) {
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
        fieldId="ssh-public-key"
        helperTextInvalid={errorMessage}
        label="Public Key"
        validated={validated}
        required={true}
      >
        <TextFileUpload
          fieldId="ssh-public-key"
          placeholder="Paste the PUBLIC key here."
          validated={validated}
          onChange={key => this.onChange(key)}
        />
      </FormGroup>
    );
  }
}
