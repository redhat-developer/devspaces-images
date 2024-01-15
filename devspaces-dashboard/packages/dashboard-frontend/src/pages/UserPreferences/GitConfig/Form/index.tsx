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

import { Button, Flex, Form, PageSection, PageSectionVariants } from '@patternfly/react-core';
import React, { FormEvent } from 'react';

import { GitConfigSectionUser } from '@/pages/UserPreferences/GitConfig/Form/SectionUser';
import * as GitConfigStore from '@/store/GitConfig';

export type Props = {
  isLoading: boolean;
  gitConfig: GitConfigStore.GitConfig;
  onSave: (gitConfig: GitConfigStore.GitConfig) => Promise<void>;
  onReload: () => Promise<void>;
};
export type State = {
  isValid: boolean;
  nextGitConfig: GitConfigStore.GitConfig | undefined;
};

export class GitConfigForm extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isValid: true,
      nextGitConfig: undefined,
    };
  }

  private handleSubmit(e: FormEvent): void {
    e.preventDefault();
    e.stopPropagation();
  }

  private async handleSave(): Promise<void> {
    const nextGitConfig = {
      ...this.props.gitConfig,
      ...(this.state.nextGitConfig || {}),
    };
    await this.props.onSave(nextGitConfig);
  }

  private async handleReload(): Promise<void> {
    try {
      await this.props.onReload();
      this.setState({
        nextGitConfig: undefined,
        isValid: true,
      });
    } catch (e) {
      // ignore
    }
  }

  private handleChangeConfig(gitConfig: GitConfigStore.GitConfig, isValid: boolean): void {
    this.setState({
      nextGitConfig: gitConfig,
      isValid,
    });
  }

  public render(): React.ReactElement {
    const { gitConfig, isLoading } = this.props;
    const { isValid, nextGitConfig } = this.state;

    const config = { ...gitConfig, ...(nextGitConfig || {}) };
    const isSaveDisabled = isLoading || isValid === false || nextGitConfig === undefined;

    return (
      <PageSection variant={PageSectionVariants.light}>
        <Form isHorizontal onSubmit={e => this.handleSubmit(e)}>
          <GitConfigSectionUser
            isLoading={isLoading}
            config={config}
            onChange={(gitConfig, isValid) => this.handleChangeConfig(gitConfig, isValid)}
          />
          <Flex>
            <Button
              data-testid="button-save"
              isDisabled={isSaveDisabled}
              type="button"
              variant="primary"
              onClick={() => this.handleSave()}
            >
              Save
            </Button>
            <Button
              data-testid="button-reload"
              disabled={isLoading}
              isDisabled={isLoading}
              type="reset"
              variant="secondary"
              onClick={() => this.handleReload()}
            >
              Reload
            </Button>
          </Flex>
        </Form>
      </PageSection>
    );
  }
}
