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
  onChange: (image: string | undefined) => void;
};
export type State = {
  image: string;
};

export class EditorImageField extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      image: '',
    };
  }

  private handleChange(value: string) {
    value = value.trim();
    this.setState({ image: value });
    this.props.onChange(value !== '' ? value : undefined);
  }

  public render() {
    const { image } = this.state;

    return (
      <FormGroup label="Editor Image">
        <TextInput
          aria-label="Editor Image"
          placeholder="Enter an editor container image"
          onChange={value => this.handleChange(value)}
          value={image}
        />
      </FormGroup>
    );
  }
}
