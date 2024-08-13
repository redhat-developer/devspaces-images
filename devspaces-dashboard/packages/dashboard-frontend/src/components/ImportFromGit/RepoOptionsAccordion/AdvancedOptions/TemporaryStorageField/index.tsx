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

import { FormGroup, Switch } from '@patternfly/react-core';
import React from 'react';

export type Props = {
  onChange: (isTemporary: boolean | undefined) => void;
  isTemporary: boolean | undefined;
};
export type State = {
  isTemporary: boolean;
};

export class TemporaryStorageField extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isTemporary: this.props.isTemporary || false,
    };
  }

  public componentDidUpdate(prevProps: Readonly<Props>): void {
    const isTemporary = this.props.isTemporary || false;
    if (prevProps.isTemporary !== isTemporary) {
      this.setState({ isTemporary });
    }
  }

  private handleChange(isTemporary: boolean) {
    this.setState({ isTemporary });
    this.props.onChange(isTemporary);
  }

  public render() {
    const { isTemporary } = this.state;

    return (
      <FormGroup label="Temporary Storage">
        <Switch
          id="temporary-storage-switch"
          aria-label="Temporary Storage"
          isChecked={isTemporary}
          onChange={value => this.handleChange(value)}
        />
      </FormGroup>
    );
  }
}
