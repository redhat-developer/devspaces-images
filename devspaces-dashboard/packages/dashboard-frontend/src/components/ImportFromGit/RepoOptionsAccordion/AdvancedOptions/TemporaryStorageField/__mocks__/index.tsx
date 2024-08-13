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

import { Props } from '@/components/ImportFromGit/RepoOptionsAccordion/AdvancedOptions/TemporaryStorageField';

export class TemporaryStorageField extends React.PureComponent<Props> {
  public render() {
    const { isTemporary, onChange } = this.props;

    return (
      <div>
        <div>Temporary Storage</div>
        <div data-testid="temporary-storage">
          {isTemporary !== undefined ? isTemporary.toString() : 'undefined'}
        </div>
        <button onClick={() => onChange(!isTemporary)}>Temporary Storage Change</button>
      </div>
    );
  }
}
