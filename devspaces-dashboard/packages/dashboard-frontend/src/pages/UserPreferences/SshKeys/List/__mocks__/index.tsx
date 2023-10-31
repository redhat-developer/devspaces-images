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

import React from 'react';

import { Props } from '..';

export class SshKeysList extends React.PureComponent<Props> {
  render() {
    const { sshKeys, onDeleteSshKeys } = this.props;

    const cards = sshKeys.map(sshKey => (
      <div key={sshKey.name} data-testid="ssh-keys-list-entry">
        {sshKey.name}
        <button onClick={() => onDeleteSshKeys([sshKey])}>Delete</button>
      </div>
    ));

    return <div>{cards}</div>;
  }
}
