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

import { FormGroup, TextInput } from '@patternfly/react-core';
import React from 'react';

export type Props = {
  onChange: (definition: string | undefined) => void;
  gitBranch: string | undefined;
};
export type State = {
  gitBranch: string | undefined;
};

export class GitBranchField extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      gitBranch: this.props.gitBranch,
    };
  }

  public shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>): boolean {
    return (
      this.state.gitBranch !== nextState.gitBranch || this.props.gitBranch !== nextProps.gitBranch
    );
  }

  public componentDidUpdate(prevProps: Readonly<Props>): void {
    const { gitBranch } = this.props;
    if (prevProps.gitBranch !== gitBranch) {
      this.setState({ gitBranch });
    }
  }

  private handleChange(value: string) {
    let gitBranch: string | undefined = value.trim();
    gitBranch = gitBranch !== '' ? gitBranch : undefined;
    if (gitBranch !== this.state.gitBranch) {
      this.setState({ gitBranch: value });
      this.props.onChange(value);
    }
  }

  public render() {
    const gitBranch = this.state.gitBranch || '';

    return (
      <FormGroup label="Git Branch">
        <TextInput
          aria-label="Git Branch"
          placeholder="Enter the branch of the Git Repository"
          onChange={value => this.handleChange(value)}
          value={gitBranch}
        />
      </FormGroup>
    );
  }
}
