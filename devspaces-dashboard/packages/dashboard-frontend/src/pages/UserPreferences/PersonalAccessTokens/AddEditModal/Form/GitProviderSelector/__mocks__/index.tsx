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

import React from 'react';

import { Props, State } from '..';

export class GitProviderSelector extends React.PureComponent<Props, State> {
  public render(): React.ReactElement {
    const { onSelect } = this.props;

    return (
      <div data-testid="git-provider">
        <input
          data-testid="submit-git-provider-azure-devops"
          type="button"
          value="Submit Provider Azure DevOps"
          onClick={() => onSelect('azure-devops')}
        />
        <input
          data-testid="submit-git-provider-github"
          type="button"
          value="Submit Provider GitHub"
          onClick={() => onSelect('github')}
        />
      </div>
    );
  }
}
