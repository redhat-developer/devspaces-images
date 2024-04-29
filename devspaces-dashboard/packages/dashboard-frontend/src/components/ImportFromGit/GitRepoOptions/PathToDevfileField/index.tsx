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
  onChange: (devfilePath: string | undefined) => void;
  devfilePath: string | undefined;
};
export type State = {
  devfilePath: string | undefined;
};

export class PathToDevfileField extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      devfilePath: this.props.devfilePath,
    };
  }

  public shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>): boolean {
    return (
      this.state.devfilePath !== nextState.devfilePath ||
      this.props.devfilePath !== nextProps.devfilePath
    );
  }

  public componentDidUpdate(prevProps: Readonly<Props>): void {
    const { devfilePath } = this.props;
    if (prevProps.devfilePath !== devfilePath) {
      this.setState({ devfilePath });
    }
  }

  private handleChange(value: string) {
    let devfilePath: string | undefined = value.trim();
    devfilePath = devfilePath !== '' ? devfilePath : undefined;
    if (devfilePath !== this.state.devfilePath) {
      this.setState({ devfilePath: value });
      this.props.onChange(value);
    }
  }

  public render() {
    const devfilePath = this.state.devfilePath || '';

    return (
      <FormGroup label="Path to Devfile">
        <TextInput
          aria-label="Path to Devfile"
          placeholder="Enter the relative path to the Devfile in the Git Repository"
          onChange={value => this.handleChange(value)}
          value={devfilePath}
        />
      </FormGroup>
    );
  }
}
