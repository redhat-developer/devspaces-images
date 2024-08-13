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

import { Props } from '@/components/ImportFromGit/RepoOptionsAccordion/GitRepoOptions/AdditionalGitRemotes';

export class AdditionalGitRemotes extends React.PureComponent<Props> {
  public render() {
    const { remotes, onChange } = this.props;

    return (
      <div>
        <div>Git Remotes</div>
        <div data-testid="git-remotes">{remotes ? JSON.stringify(remotes) : 'undefined'}</div>
        <button onClick={() => onChange([{ name: 'test-updated', url: 'http://test' }], true)}>
          Git Remotes Change
        </button>
      </div>
    );
  }
}
