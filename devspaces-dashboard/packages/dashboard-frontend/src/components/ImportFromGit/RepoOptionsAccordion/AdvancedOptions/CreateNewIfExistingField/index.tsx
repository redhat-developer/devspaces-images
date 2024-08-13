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
  onChange: (createNewIfExisting: boolean | undefined) => void;
  createNewIfExisting: boolean | undefined;
};
export type State = {
  createNewIfExisting: boolean;
};

export class CreateNewIfExistingField extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      createNewIfExisting: this.props.createNewIfExisting || false,
    };
  }

  public componentDidUpdate(prevProps: Readonly<Props>): void {
    const createNewIfExisting = this.props.createNewIfExisting || false;
    if (prevProps.createNewIfExisting !== createNewIfExisting) {
      this.setState({ createNewIfExisting });
    }
  }

  private handleChange(createNewIfExisting: boolean) {
    this.setState({ createNewIfExisting });
    this.props.onChange(createNewIfExisting);
  }

  public render() {
    const { createNewIfExisting } = this.state;

    return (
      <FormGroup label="Create New If Existing">
        <Switch
          id="create-new-if-existing-switch"
          aria-label="Create New If Existing"
          isChecked={createNewIfExisting}
          onChange={value => this.handleChange(value)}
        />
      </FormGroup>
    );
  }
}
