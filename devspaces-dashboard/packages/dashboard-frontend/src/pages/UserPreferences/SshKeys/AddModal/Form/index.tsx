/*
 * Copyright (c) 2018-2023 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { api } from '@eclipse-che/common';
import { Form } from '@patternfly/react-core';
import React from 'react';

import { SshPrivateKey } from '@/pages/UserPreferences/SshKeys/AddModal/Form/SshPrivateKey';
import { SshPublicKey } from '@/pages/UserPreferences/SshKeys/AddModal/Form/SshPublicKey';

const SSH_KEY_NAME = 'git-ssh-key';

export type Props = {
  onChange: (newSshKey: api.NewSshKey, isValid: boolean) => void;
};
export type State = {
  privateKey: string | undefined;
  privateKeyIsValid: boolean;
  publicKey: string | undefined;
  publicKeyIsValid: boolean;
};

export class AddModalForm extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      privateKey: undefined,
      privateKeyIsValid: false,
      publicKey: undefined,
      publicKeyIsValid: false,
    };
  }

  private updateChangeSshKey(partialState: Partial<State>): void {
    const nextState = { ...this.state, ...partialState };
    this.setState(nextState);

    const { privateKey = '', privateKeyIsValid, publicKey = '', publicKeyIsValid } = nextState;

    const newSshKey: api.NewSshKey = {
      name: SSH_KEY_NAME,
      key: privateKey,
      keyPub: publicKey,
    };
    const isValid = privateKeyIsValid && publicKeyIsValid;
    this.props.onChange(newSshKey, isValid);
  }

  private handleChangeSshPrivateKey(privateKey: string, privateKeyIsValid: boolean): void {
    this.updateChangeSshKey({
      privateKey,
      privateKeyIsValid,
    });
  }

  private handleChangeSshPublicKey(publicKey: string, publicKeyIsValid: boolean): void {
    this.updateChangeSshKey({
      publicKey,
      publicKeyIsValid,
    });
  }

  public render(): React.ReactElement {
    return (
      <Form onSubmit={e => e.preventDefault()}>
        <SshPrivateKey onChange={(...args) => this.handleChangeSshPrivateKey(...args)} />
        <SshPublicKey onChange={(...args) => this.handleChangeSshPublicKey(...args)} />
      </Form>
    );
  }
}
