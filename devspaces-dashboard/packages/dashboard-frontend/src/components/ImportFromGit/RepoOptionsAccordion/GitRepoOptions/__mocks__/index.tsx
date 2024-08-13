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

import { Props } from '@/components/ImportFromGit/RepoOptionsAccordion/GitRepoOptions';

export class GitRepoOptions extends React.PureComponent<Props> {
  public render() {
    const { gitBranch, remotes, devfilePath, hasSupportedGitService, onChange } = this.props;

    return (
      <div>
        <div>Git Repo Options</div>
        <div data-testid="git-repo-options">{`${gitBranch}, ${JSON.stringify(remotes)}, ${devfilePath}, ${hasSupportedGitService}`}</div>
        <button
          onClick={() =>
            onChange(
              'newBranch',
              [{ name: 'test-updated', url: 'http://test' }],
              'newDevfilePath',
              true,
            )
          }
        >
          Git Repo Options Change
        </button>
      </div>
    );
  }
}
