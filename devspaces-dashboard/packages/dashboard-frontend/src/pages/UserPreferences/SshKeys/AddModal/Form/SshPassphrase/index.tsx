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
  onChange: (passphrase: string) => void;
};

export type State = {
  passphrase: string | undefined;
};

export class SshPassphrase extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      passphrase: undefined,
    };
  }

  private onChange(passphrase: string): void {
    const { onChange } = this.props;

    this.setState({ passphrase });
    onChange(passphrase);
  }

  public render(): React.ReactElement {
    return (
      <FormGroup fieldId="ssh-passphrase" label="Passphrase" isRequired={false}>
        <TextInput
          aria-label="Passphrase"
          placeholder="Enter passphrase (optional)"
          onChange={passphrase => this.onChange(passphrase)}
          type="password"
        />
      </FormGroup>
    );
  }
}
