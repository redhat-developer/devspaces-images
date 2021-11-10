/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import React from 'react';
import {
  Button,
  ButtonVariant,
  TextInput,
  ValidatedOptions,
  Flex,
  FlexItem,
  Form,
  FormGroup,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

const ERROR_TYPE_MISMATCH = 'The URL is not valid.';
const ERROR_FAILED_LOAD = 'Failed to load the devfile';

type Props = {
  onChange: (location: string) => void;
  isLoading?: boolean;
};
type State = {
  validated: ValidatedOptions;
  location: string;
  errorMessage?: string;
};

export class DevfileLocationInput extends React.PureComponent<Props, State> {
  options: JSX.Element[];

  constructor(props: Props) {
    super(props);

    this.state = {
      validated: ValidatedOptions.default,
      location: '',
    };
  }

  /**
   * This method is used from parent component by reference.
   */
  public clearInput(): void {
    this.setState({
      errorMessage: undefined,
      location: '',
      validated: ValidatedOptions.default,
    });
  }

  /**
   * This method is used from parent component by reference.
   */
  public invalidateInput(): void {
    this.setState({
      errorMessage: ERROR_FAILED_LOAD,
      validated: ValidatedOptions.error,
    });
  }

  private handleChange(location: string, event: React.FormEvent<HTMLInputElement>): void {
    const validity = (event.target as HTMLInputElement).validity;
    if (validity.valid === true) {
      this.setState({
        validated: ValidatedOptions.default,
        errorMessage: undefined,
      });
    } else {
      this.setState({
        validated: ValidatedOptions.error,
        errorMessage: validity.typeMismatch ? ERROR_TYPE_MISMATCH : undefined,
      });
    }

    this.setState({
      location,
    });
  }

  private handleClick(): void {
    this.props.onChange(this.state.location);
  }

  public render() {
    const { location, validated, errorMessage } = this.state;

    const fieldId = 'devfile-url';
    const buttonDisabled =
      location === '' || validated === ValidatedOptions.error || this.props.isLoading;
    return (
      <Form
        onSubmit={e => {
          e.preventDefault();
          if (!buttonDisabled) {
            this.handleClick();
          }
        }}
      >
        <FormGroup
          fieldId={fieldId}
          validated={validated}
          helperTextInvalid={errorMessage}
          helperTextInvalidIcon={<ExclamationCircleIcon />}
        >
          <Flex direction={{ default: 'row' }} grow={{ default: 'grow' }}>
            <FlexItem grow={{ default: 'grow' }}>
              <TextInput
                id={fieldId}
                type="url"
                aria-label="URL of devfile"
                validated={validated}
                placeholder="Enter devfile URL"
                onChange={(value, event) => this.handleChange(value, event)}
                value={location}
              />
            </FlexItem>
            <FlexItem>
              <Button
                id="fetch-devfile-button"
                isDisabled={buttonDisabled}
                variant={ButtonVariant.secondary}
                onClick={() => this.handleClick()}
              >
                Load Devfile
              </Button>
            </FlexItem>
          </Flex>
        </FormGroup>
      </Form>
    );
  }
}
