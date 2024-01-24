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

import React from 'react';

import { Props } from '@/pages/GetStarted/GetStartedTab/ImportFromGit';

export class ImportFromGit extends React.PureComponent<Props> {
  public render() {
    const { hasSshKeys } = this.props;
    return (
      <div>
        <span data-testid="has-ssh-keys">{hasSshKeys ? 'true' : 'false'}</span>
      </div>
    );
  }
}
