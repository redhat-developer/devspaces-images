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
  containerImage: string | undefined;
};
export type State = {
  containerImage: string | undefined;
};

export class ContainerImageField extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      containerImage: this.props.containerImage,
    };
  }

  public componentDidUpdate(prevProps: Readonly<Props>): void {
    const { containerImage } = this.props;
    if (prevProps.containerImage !== containerImage) {
      this.setState({ containerImage });
    }
  }

  private handleChange(value: string) {
    let containerImage: string | undefined = value.trim();
    containerImage = containerImage !== '' ? containerImage : undefined;
    if (containerImage !== this.state.containerImage) {
      this.setState({ containerImage });
      this.props.onChange(containerImage);
    }
  }

  public render() {
    const containerImage = this.state.containerImage || '';

    return (
      <FormGroup label="Container Image">
        <TextInput
          aria-label="Container Image"
          placeholder="Enter the container image"
          onChange={value => this.handleChange(value)}
          value={containerImage}
        />
      </FormGroup>
    );
  }
}
