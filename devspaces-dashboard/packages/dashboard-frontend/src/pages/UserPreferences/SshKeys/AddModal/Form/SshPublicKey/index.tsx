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

import { FormGroup, ValidatedOptions } from '@patternfly/react-core';
import React from 'react';

import { TextFileUpload } from '@/components/TextFileUpload';

export const REQUIRED_ERROR = 'This field is required.';
const MAX_LENGTH = 4096;
export const MAX_LENGTH_ERROR = `The value is too long. The maximum length is ${MAX_LENGTH} characters.`;
export const WRONG_TYPE_ERROR = 'This file type is not supported.';

export type Props = {
  onChange: (publicKey: string, isValid: boolean) => void;
};

export type State = {
  isUpload: boolean;
  publicKey: string | undefined;
  validated: ValidatedOptions;
};

export class SshPublicKey extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isUpload: false,
      publicKey: undefined,
      validated: ValidatedOptions.default,
    };
  }

  public shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>): boolean {
    const { publicKey, validated } = this.state;
    const { publicKey: nextPublicKey, validated: nextValidated } = nextState;

    return publicKey !== nextPublicKey || validated !== nextValidated;
  }

  private onChange(publicKey: string, isUpload: boolean): void {
    const { onChange } = this.props;

    publicKey = publicKey.trim()
      ? btoa(
          // expect the only new line at the end
          publicKey.trim() + '\n',
        )
      : '';

    const validated = this.validate(publicKey);
    const isValid = validated === ValidatedOptions.success;

    this.setState({ publicKey, validated, isUpload });
    onChange(publicKey, isValid);
  }

  private validate(publicKey: string): ValidatedOptions {
    if (publicKey.length === 0) {
      return ValidatedOptions.error;
    } else if (publicKey.length > MAX_LENGTH) {
      return ValidatedOptions.error;
    } else {
      return ValidatedOptions.success;
    }
  }

  private getErrorMessage(key: string | undefined, isUpload: boolean): string | undefined {
    if (key && key.length > MAX_LENGTH) {
      return MAX_LENGTH_ERROR;
    }
    if (isUpload === true) {
      return WRONG_TYPE_ERROR;
    }
    return REQUIRED_ERROR;
  }

  public render(): React.ReactElement {
    const { validated, publicKey, isUpload } = this.state;

    const errorMessage = this.getErrorMessage(publicKey, isUpload);

    return (
      <FormGroup
        fieldId="ssh-public-key"
        helperTextInvalid={errorMessage}
        label="Public Key"
        validated={validated}
        isRequired={true}
      >
        <TextFileUpload
          fieldId="ssh-public-key"
          fileNamePlaceholder="Upload the PUBLIC key"
          textAreaPlaceholder="Or paste the PUBLIC key"
          validated={validated}
          onChange={(key, isUpload) => this.onChange(key, isUpload)}
        />
      </FormGroup>
    );
  }
}
