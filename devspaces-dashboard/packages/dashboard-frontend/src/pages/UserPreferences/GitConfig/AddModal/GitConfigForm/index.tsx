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

import { Form, FormGroup, ValidatedOptions } from '@patternfly/react-core';
import * as ini from 'multi-ini';
import React from 'react';

import { GitConfigImport } from '@/pages/UserPreferences/GitConfig/GitConfigImport';
import * as GitConfigStore from '@/store/GitConfig';

export const REQUIRED_ERROR = 'This field is required.';
const MAX_LENGTH = 4096;
export const MAX_LENGTH_ERROR = `The value is too long. The maximum length is ${MAX_LENGTH} characters.`;
export const WRONG_TYPE_ERROR = 'This file type is not supported.';

export type Props = {
  gitConfig: GitConfigStore.GitConfig | undefined;
  onChange: (gitConfig: GitConfigStore.GitConfig, isValid: boolean) => void;
};

export type State = {
  isUpload: boolean;
  gitConfig: GitConfigStore.GitConfig | undefined;
  gitConfigStr: string | undefined;
  validated: ValidatedOptions;
};

export class GitConfigForm extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isUpload: false,
      gitConfig: undefined,
      gitConfigStr: undefined,
      validated: ValidatedOptions.default,
    };
  }

  public componentDidMount() {
    const { gitConfig } = this.props;
    const gitConfigStr = this.stringifyGitConfig(gitConfig);
    if (gitConfigStr !== undefined) {
      this.onChange(gitConfigStr, false);
    }
  }

  public shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>): boolean {
    const { gitConfig, validated } = this.state;
    const { gitConfig: nextGitConfig, validated: nextValidated } = nextState;

    return gitConfig !== nextGitConfig || validated !== nextValidated;
  }

  private parseGitConfig(gitConfigStr: string): GitConfigStore.GitConfig {
    const parser = new ini.Parser();
    const gitConfigLines = gitConfigStr.split(/\r?\n/);
    const gitConfig = parser.parse(gitConfigLines);
    return gitConfig as GitConfigStore.GitConfig;
  }

  private stringifyGitConfig(gitConfig: GitConfigStore.GitConfig | undefined): string | undefined {
    if (gitConfig === undefined) {
      return undefined;
    }
    const serializer = new ini.Serializer();
    return serializer
      .serialize(gitConfig)
      .replace(/\n/g, '\n    ')
      .replace(/ {4}\[/g, '[');
  }

  private onChange(gitConfigStr: string, isUpload: boolean): void {
    const { onChange } = this.props;
    try {
      const gitConfig = this.parseGitConfig(gitConfigStr);
      const validated = this.validate(gitConfig);
      const isValid = validated === ValidatedOptions.success;

      this.setState({ gitConfigStr, gitConfig, validated, isUpload });
      onChange(gitConfig, isValid);
    } catch (error) {
      console.log(error);
      this.setState({ validated: ValidatedOptions.error, isUpload });
    }
  }

  private validate(gitConfig: GitConfigStore.GitConfig): ValidatedOptions {
    return this.isGitConfig(gitConfig) ? ValidatedOptions.success : ValidatedOptions.error;
  }

  private isGitConfig(gitConfig: unknown): gitConfig is GitConfigStore.GitConfig {
    return (
      (gitConfig as GitConfigStore.GitConfig).user !== undefined &&
      (gitConfig as GitConfigStore.GitConfig).user.email !== undefined &&
      (gitConfig as GitConfigStore.GitConfig).user.name !== undefined
    );
  }

  private getErrorMessage(gitConfigStr: string | undefined, isUpload: boolean): string | undefined {
    if (gitConfigStr && gitConfigStr.length > MAX_LENGTH) {
      return MAX_LENGTH_ERROR;
    }
    if (isUpload) {
      return WRONG_TYPE_ERROR;
    }
    return REQUIRED_ERROR;
  }

  public render(): React.ReactElement {
    const { validated, gitConfigStr, isUpload } = this.state;

    const errorMessage = this.getErrorMessage(gitConfigStr, isUpload);

    const content = this.stringifyGitConfig(this.props.gitConfig);

    return (
      <Form onSubmit={e => e.preventDefault()}>
        <FormGroup
          fieldId="gitconfig"
          helperTextInvalid={errorMessage}
          label="gitconfig"
          validated={validated}
        >
          <GitConfigImport
            content={content}
            validated={validated}
            onChange={(gitConfig, isUpload) => this.onChange(gitConfig, isUpload)}
          />
        </FormGroup>
      </Form>
    );
  }
}
