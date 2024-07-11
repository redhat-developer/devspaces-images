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

import React from 'react';

import { Props } from '@/pages/UserPreferences/GitConfig/AddModal/GitConfigForm';
import * as GitConfigStore from '@/store/GitConfig';

export class GitConfigForm extends React.PureComponent<Props> {
  render() {
    const { onChange } = this.props;

    return (
      <div>
        <input
          data-testid="submit-invalid-git-config"
          type="button"
          onClick={() =>
            onChange({ user: { name: 'User One' } } as GitConfigStore.GitConfig, false)
          }
        />
        <input
          data-testid="submit-valid-git-config"
          type="button"
          onClick={() =>
            onChange({ user: { email: 'user-1@chetest.com', name: 'User One' } }, true)
          }
        />
      </div>
    );
  }
}
