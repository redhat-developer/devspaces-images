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

import { Props } from '@/components/ImportFromGit/RepoOptionsAccordion/GitRepoOptions/GitBranchField';

export class GitBranchField extends React.PureComponent<Props> {
  public render() {
    const { gitBranch, onChange } = this.props;

    return (
      <div data-testid="git-branch-component">
        <div>Git Branch</div>
        <div data-testid="git-branch">{gitBranch}</div>
        <button onClick={() => onChange('new-branch')}>Git Branch Change</button>
      </div>
    );
  }
}
