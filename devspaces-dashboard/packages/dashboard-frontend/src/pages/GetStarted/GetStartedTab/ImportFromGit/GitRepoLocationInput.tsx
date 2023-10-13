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

import {
  Button,
  ButtonVariant,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  Text,
  TextContent,
  TextInput,
  TextVariants,
  ValidatedOptions,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import React from 'react';

import { FactoryLocationAdapter } from '@/services/factory-location-adapter';

const ERROR_PATTERN_MISMATCH = 'The URL or SSHLocation is not valid.';

type Props = {
  onChange: (location: string) => void;
  isLoading?: boolean;
};
type State = {
  validated: ValidatedOptions;
  location: string;
  errorMessage?: string;
};

export class GitRepoLocationInput extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      validated: ValidatedOptions.default,
      location: '',
    };
  }

  private handleChange(location: string): void {
    const isValid =
      FactoryLocationAdapter.isHttpLocation(location) ||
      FactoryLocationAdapter.isSshLocation(location);

    if (isValid) {
      this.setState({
        validated: ValidatedOptions.default,
        errorMessage: undefined,
      });
    } else {
      this.setState({
        validated: ValidatedOptions.error,
        errorMessage: ERROR_PATTERN_MISMATCH,
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
    const fieldId = 'git-repo-url';
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
          <Flex>
            <FlexItem grow={{ default: 'grow' }} style={{ maxWidth: '500px' }}>
              <TextContent>
                <TextInput
                  id={fieldId}
                  aria-label="HTTPS or SSH URL"
                  placeholder="Enter HTTPS or SSH URL"
                  validated={validated}
                  onChange={value => this.handleChange(value)}
                  value={location}
                />
                <Text component={TextVariants.small}>
                  Import from a Git repository to create your first workspace.
                </Text>
              </TextContent>
            </FlexItem>
            <FlexItem>
              <Button
                id="create-and-open-button"
                isDisabled={buttonDisabled}
                variant={ButtonVariant.secondary}
                onClick={() => this.handleClick()}
              >
                Create & Open
              </Button>
            </FlexItem>
          </Flex>
        </FormGroup>
      </Form>
    );
  }
}
