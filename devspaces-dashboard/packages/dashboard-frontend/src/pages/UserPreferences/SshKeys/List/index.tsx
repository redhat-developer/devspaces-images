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
import { PageSection } from '@patternfly/react-core';
import React from 'react';

import { SshKeysListEntry } from '@/pages/UserPreferences/SshKeys/List/Entry';

export type Props = {
  sshKeys: api.SshKey[];
  onDeleteSshKeys: (keys: api.SshKey[]) => void;
};

export class SshKeysList extends React.PureComponent<Props> {
  private handleDeleteEntry(sskKey: api.SshKey): void {
    this.props.onDeleteSshKeys([sskKey]);
  }

  render() {
    const { sshKeys } = this.props;

    const cards = sshKeys.map(sshKey => (
      <SshKeysListEntry
        key={sshKey.name}
        sshKey={sshKey}
        onDeleteSshKey={sshKey => this.handleDeleteEntry(sshKey)}
      />
    ));

    return <PageSection>{cards}</PageSection>;
  }
}
