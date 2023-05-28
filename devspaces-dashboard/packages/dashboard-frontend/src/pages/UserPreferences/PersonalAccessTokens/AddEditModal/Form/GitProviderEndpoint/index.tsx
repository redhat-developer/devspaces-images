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

const INVALID_URL_ERROR = 'The URL is not valid.';
const REQUIRED_ERROR = 'This field is required.';

export type Props = {
  defaultProviderEndpoint: string;
  providerEndpoint: string | undefined;
  onChange: (providerEndpoint: string, isValid: boolean) => void;
};

export type State = {
  providerEndpoint: string | undefined;
  validated: ValidatedOptions;
};

export class GitProviderEndpoint extends React.PureComponent<Props, State> {
  private textInputRef = React.createRef<HTMLInputElement>();

  constructor(props: Props) {
    super(props);

    const providerEndpoint = this.props.providerEndpoint || this.props.defaultProviderEndpoint;
    const validated = ValidatedOptions.default;

    this.state = {
      providerEndpoint,
      validated,
    };
  }

  public componentDidMount(): void {
    this.init();
  }

  public componentDidUpdate(prevProps: Props): void {
    this.init(prevProps);
  }

  private init(prevProps?: Props): void {
    const { validated } = this.state;

    /* Decide whether to change input value to a new default */

    // value has been changed by user
    if (validated !== ValidatedOptions.default) {
      // do nothing
      return;
    }
    // parent component passed value so the default value should be ignored
    if (this.props.providerEndpoint !== undefined) {
      // do nothing
      return;
    }
    // default value has not been changed
    if (prevProps?.defaultProviderEndpoint === this.props.defaultProviderEndpoint) {
      // do nothing
      return;
    }

    // use the new default value
    this.setState({ providerEndpoint: this.props.defaultProviderEndpoint });
  }

  /**
   * Set the focus on the input field and select the text
   * if the input field has not been touched yet.
   */
  private handleFocus(): void {
    const { validated } = this.state;
    if (validated === ValidatedOptions.default && this.textInputRef.current !== null) {
      this.textInputRef.current.setSelectionRange(0, this.textInputRef.current.value.length);
    }
  }

  private handleChange(providerEndpoint: string): void {
    const { onChange } = this.props;
    const validated = this.validate(providerEndpoint);
    const isValid = validated === ValidatedOptions.success;

    this.setState({ providerEndpoint, validated });
    onChange(providerEndpoint, isValid);
  }

  private validate(providerEndpoint: string): ValidatedOptions {
    try {
      const url = new URL(providerEndpoint);
      return url.protocol === 'http:' || url.protocol === 'https:'
        ? ValidatedOptions.success
        : ValidatedOptions.error;
    } catch (e) {
      return ValidatedOptions.error;
    }
  }

  public render(): React.ReactElement {
    const { providerEndpoint = '', validated } = this.state;
    const errorMessage = providerEndpoint.length === 0 ? REQUIRED_ERROR : INVALID_URL_ERROR;

    return (
      <FormGroup
        fieldId="git-provider-endpoint-label"
        helperTextInvalid={errorMessage}
        label="Git Provider Endpoint"
        validated={validated}
        isRequired
      >
        <TextInput
          aria-describedby="git-provider-endpoint-label"
          aria-label="Git Provider Endpoint"
          onChange={providerEndpoint => this.handleChange(providerEndpoint)}
          onFocus={() => this.handleFocus()}
          placeholder="Enter a Git Provider Endpoint"
          ref={this.textInputRef}
          type={TextInputTypes.url}
          value={providerEndpoint}
        />
      </FormGroup>
    );
  }
}
