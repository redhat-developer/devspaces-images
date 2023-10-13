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

import * as React from 'react';

import { Props } from '..';

export class GitConfigSectionUser extends React.PureComponent<Props> {
  render(): React.ReactElement {
    const { config, onChange } = this.props;
    return (
      <div>
        <div data-testid="user-email">{config.email || ''}</div>
        <div data-testid="user-name">{config.name || ''}</div>
        <button onClick={() => onChange({ email: 'new-user@che', name: 'new user' })}>
          Change Email
        </button>
      </div>
    );
  }
}
