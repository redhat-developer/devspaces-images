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

import { Props } from '..';

export class GitConfigForm extends React.PureComponent<Props> {
  render(): React.ReactElement {
    const { isLoading, gitConfig, onReload, onSave } = this.props;

    return (
      <div data-testid="git-config-form">
        <span data-testid="is-loading">{isLoading}</span>
        <span data-testid="git-config">{JSON.stringify(gitConfig)}</span>
        <button onClick={() => onSave({ user: { email: 'new-user@che', name: 'new user name' } })}>
          Save Config
        </button>
        <button onClick={() => onReload()}>Reload Config</button>
      </div>
    );
  }
}
