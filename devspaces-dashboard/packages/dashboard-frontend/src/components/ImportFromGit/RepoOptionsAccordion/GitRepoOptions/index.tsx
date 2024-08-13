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

import { Form } from '@patternfly/react-core';
import { isEqual } from 'lodash';
import React from 'react';

import { AdditionalGitRemotes } from '@/components/ImportFromGit/RepoOptionsAccordion/GitRepoOptions/AdditionalGitRemotes';
import { GitBranchField } from '@/components/ImportFromGit/RepoOptionsAccordion/GitRepoOptions/GitBranchField';
import { PathToDevfileField } from '@/components/ImportFromGit/RepoOptionsAccordion/GitRepoOptions/PathToDevfileField';
import { GitRemote } from '@/components/WorkspaceProgress/CreatingSteps/Apply/Devfile/getGitRemotes';

export type Props = {
  gitBranch: string | undefined;
  remotes: GitRemote[] | undefined;
  devfilePath: string | undefined;
  hasSupportedGitService: boolean;
  onChange: (
    gitBranch: string | undefined,
    remotes: GitRemote[] | undefined,
    devfilePath: string | undefined,
    isValid: boolean,
  ) => void;
};

export type State = {
  gitBranch: string | undefined;
  remotes: GitRemote[] | undefined;
  devfilePath: string | undefined;
  isValid: boolean;
};

export class GitRepoOptions extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      gitBranch: props.gitBranch,
      remotes: props.remotes,
      devfilePath: props.devfilePath,
      isValid: true,
    };
  }

  public componentDidUpdate(prevProps: Readonly<Props>): void {
    const { gitBranch, remotes, devfilePath } = this.props;

    if (gitBranch !== prevProps.gitBranch) {
      this.setState({ gitBranch });
    }

    if (!isEqual(remotes, prevProps.remotes)) {
      this.setState({ remotes });
    }

    if (devfilePath !== prevProps.devfilePath) {
      this.setState({ devfilePath });
    }
  }
  private handleGitBranch(gitBranch: string | undefined) {
    const { remotes, devfilePath, isValid } = this.state;

    this.setState({ gitBranch });
    this.props.onChange(gitBranch, remotes, devfilePath, isValid);
  }

  private handleRemotes(remotes: GitRemote[] | undefined, isValid: boolean) {
    const { gitBranch, devfilePath } = this.state;

    this.setState({ remotes, isValid });
    this.props.onChange(gitBranch, remotes, devfilePath, isValid);
  }

  private handleDevfilePath(devfilePath: string | undefined) {
    const { gitBranch, remotes, isValid } = this.state;

    this.setState({ devfilePath });
    this.props.onChange(gitBranch, remotes, devfilePath, isValid);
  }
  public render() {
    const { hasSupportedGitService } = this.props;
    const { gitBranch, remotes, devfilePath } = this.state;
    return (
      <Form isHorizontal={true} onSubmit={e => e.preventDefault()}>
        {hasSupportedGitService && (
          <GitBranchField
            onChange={gitBranch => this.handleGitBranch(gitBranch)}
            gitBranch={gitBranch}
          />
        )}
        <AdditionalGitRemotes
          onChange={(remotes: GitRemote[] | undefined, isValid: boolean) =>
            this.handleRemotes(remotes, isValid)
          }
          remotes={remotes}
        />
        <PathToDevfileField
          onChange={devfilePath => this.handleDevfilePath(devfilePath)}
          devfilePath={devfilePath}
        />
      </Form>
    );
  }
}
