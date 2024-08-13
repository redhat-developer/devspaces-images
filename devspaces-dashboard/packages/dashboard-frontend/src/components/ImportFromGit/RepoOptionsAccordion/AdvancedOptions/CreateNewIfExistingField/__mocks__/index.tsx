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

import { Props } from '@/components/ImportFromGit/RepoOptionsAccordion/AdvancedOptions/CreateNewIfExistingField';

export class CreateNewIfExistingField extends React.PureComponent<Props> {
  public render() {
    const { createNewIfExisting, onChange } = this.props;

    return (
      <div>
        <div>Create New If Existing</div>
        <div data-testid="create-new-if-existing">
          {createNewIfExisting !== undefined ? createNewIfExisting.toString() : 'undefined'}
        </div>
        <button onClick={() => onChange(!createNewIfExisting)}>
          Create New If Existing Change
        </button>
      </div>
    );
  }
}
