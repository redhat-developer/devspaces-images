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

import { FormSection, Panel, PanelMain, PanelMainBody } from '@patternfly/react-core';
import * as React from 'react';

import { GitConfigUserEmail } from '@/pages/UserPreferences/GitConfig/Form/SectionUser/Email';
import { GitConfigUserName } from '@/pages/UserPreferences/GitConfig/Form/SectionUser/Name';
import { GitConfig } from '@/store/GitConfig';

export type Props = {
  config: GitConfig;
  isLoading: boolean;
  onChange: (gitConfig: GitConfig, isValid: boolean) => void;
};

export class GitConfigSectionUser extends React.PureComponent<Props> {
  private handleChange(partialConfigUser: Partial<GitConfig['user']>, isValid: boolean): void {
    const { config, onChange } = this.props;

    onChange(
      {
        ...config,
        user: {
          ...config.user,
          ...partialConfigUser,
        },
      },
      isValid,
    );
  }

  public render(): React.ReactElement {
    const { config, isLoading } = this.props;
    return (
      <Panel>
        <PanelMain>
          <PanelMainBody>
            <FormSection title="[user]" label="user">
              <GitConfigUserName
                isLoading={isLoading}
                value={config.user.name}
                onChange={(name, isValid) => this.handleChange({ name }, isValid)}
              />
              <GitConfigUserEmail
                isLoading={isLoading}
                value={config.user.email}
                onChange={(email, isValid) => this.handleChange({ email }, isValid)}
              />
            </FormSection>
          </PanelMainBody>
        </PanelMain>
      </Panel>
    );
  }
}
