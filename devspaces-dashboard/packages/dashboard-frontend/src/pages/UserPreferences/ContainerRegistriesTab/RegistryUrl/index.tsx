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
  FormGroup,
  InputGroupText,
  TextInput,
  ValidatedOptions,
} from '@patternfly/react-core';
import { ExclamationCircleIcon, ExternalLinkAltIcon } from '@patternfly/react-icons';
import React from 'react';

const MAX_LENGTH = 256;
const PATTERN =
  '^http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+$';
const ERROR_REQUIRED_VALUE = 'A value is required.';
const ERROR_MAX_LENGTH = `The url is too long. The maximum length is ${MAX_LENGTH} characters.`;

type Props = {
  url: string;
  onChange?: (url: string, valid: ValidatedOptions) => void;
};

type State = {
  errorMessage?: string;
  url: string;
  valid: ValidatedOptions;
  isUrl?: boolean;
};

export class RegistryUrlFormGroup extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    const url = this.props.url;
    const valid = ValidatedOptions.default;

    this.state = { url, valid };
  }

  public componentDidUpdate(prevProps: Props): void {
    const { url } = this.props;
    if (prevProps.url !== url) {
      const isUrl = new RegExp(PATTERN).test(url);
      this.setState({ url, isUrl });
    }
  }

  private onChange(url: string): void {
    if (this.state.url === url) {
      return;
    }
    const { onChange } = this.props;
    const { errorMessage, valid } = this.validate(url);

    this.setState({ url, valid, errorMessage });
    if (onChange) {
      onChange(url, valid);
    }
  }

  private validate(url: string): { valid: ValidatedOptions; errorMessage?: string } {
    if (url.length === 0) {
      return {
        errorMessage: ERROR_REQUIRED_VALUE,
        valid: ValidatedOptions.error,
      };
    } else if (url.length > MAX_LENGTH) {
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
    const { url, isUrl, errorMessage, valid } = this.state;

    return (
      <FormGroup
        style={{ gridTemplateColumns: '80px', minHeight: '65px' }}
        label="Registry"
        fieldId="id-registry-helper"
        helperTextInvalid={errorMessage}
        isRequired={true}
        helperTextInvalidIcon={<ExclamationCircleIcon />}
        validated={valid}
      >
        <InputGroupText>
          <TextInput
            aria-label="Url input"
            placeholder="Enter a registry"
            type="url"
            value={url}
            validated={valid}
            onChange={_url => this.onChange(_url)}
          />
          <Button variant="link" isDisabled={!url || !isUrl} aria-label="open registry">
            <a href={url} style={{ color: 'inherit' }} target="_blank" rel="noreferrer">
              <ExternalLinkAltIcon />
            </a>
          </Button>
        </InputGroupText>
      </FormGroup>
    );
  }
}
