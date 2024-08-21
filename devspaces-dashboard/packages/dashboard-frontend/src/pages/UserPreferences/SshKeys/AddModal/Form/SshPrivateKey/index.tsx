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
const MAX_LENGTH = 16384;
export const MAX_LENGTH_ERROR = `The value is too long. The maximum length is ${MAX_LENGTH} characters.`;
export const WRONG_TYPE_ERROR = 'This file type is not supported.';

export type Props = {
  onChange: (privateKey: string, isValid: boolean) => void;
};

export type State = {
  isUpload: boolean;
  privateKey: string | undefined;
  validated: ValidatedOptions;
};

export class SshPrivateKey extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isUpload: false,
      privateKey: undefined,
      validated: ValidatedOptions.default,
    };
  }

  public shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>): boolean {
    const { privateKey, validated } = this.state;
    const { privateKey: nextPrivateKey, validated: nextValidated } = nextState;

    return privateKey !== nextPrivateKey || validated !== nextValidated;
  }

  private onChange(privateKey: string, isUpload: boolean): void {
    const { onChange } = this.props;

    privateKey = privateKey.trim()
      ? btoa(
          // expect the only new line at the end
          privateKey.trim() + '\n',
        )
      : '';

    const validated = this.validate(privateKey);
    const isValid = validated === ValidatedOptions.success;

    this.setState({ privateKey, validated, isUpload });
    onChange(privateKey, isValid);
  }

  private validate(privateKey: string): ValidatedOptions {
    if (privateKey.length === 0) {
      return ValidatedOptions.error;
    } else if (privateKey.length > MAX_LENGTH) {
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
    const { validated, privateKey, isUpload } = this.state;

    const errorMessage = this.getErrorMessage(privateKey, isUpload);

    return (
      <FormGroup
        fieldId="ssh-private-key"
        helperTextInvalid={errorMessage}
        label="Private Key"
        validated={validated}
        isRequired={true}
      >
        <TextFileUpload
          fieldId="ssh-private-key"
          fileNamePlaceholder="Upload the PRIVATE key"
          textAreaPlaceholder="Or paste the PRIVATE key"
          validated={validated}
          onChange={(key, isUpload) => this.onChange(key, isUpload)}
        />
      </FormGroup>
    );
  }
}
