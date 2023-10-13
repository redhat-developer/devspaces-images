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

import { Form, FormSection, Panel, PanelMain, PanelMainBody } from '@patternfly/react-core';
import * as React from 'react';

import { GitConfigUserEmail } from '@/pages/UserPreferences/GitConfig/SectionUser/Email';
import { GitConfigUserName } from '@/pages/UserPreferences/GitConfig/SectionUser/Name';
import { GitConfigUser } from '@/store/GitConfig';

export type Props = {
  config: GitConfigUser;
  onChange: (gitConfigUser: GitConfigUser) => void;
};

export class GitConfigSectionUser extends React.PureComponent<Props> {
  private handleChange(partialConfig: Partial<GitConfigUser>): void {
    const { config, onChange } = this.props;

    onChange({
      ...config,
      ...partialConfig,
    });
  }

  public render(): React.ReactElement {
    const { config } = this.props;
    return (
      <Panel>
        <PanelMain>
          <PanelMainBody>
            <Form isHorizontal onSubmit={e => e.preventDefault()}>
              <FormSection title="[user]" label="user">
                <GitConfigUserName
                  value={config.name}
                  onChange={name => this.handleChange({ name })}
                />
                <GitConfigUserEmail
                  value={config.email}
                  onChange={email => this.handleChange({ email })}
                />
              </FormSection>
            </Form>
          </PanelMainBody>
        </PanelMain>
      </Panel>
    );
  }
}
