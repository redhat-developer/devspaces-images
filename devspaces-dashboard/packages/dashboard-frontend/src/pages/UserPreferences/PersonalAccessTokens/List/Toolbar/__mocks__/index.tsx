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

export class PersonalAccessTokenListToolbar extends React.PureComponent<Props> {
  render() {
    const { isDisabled, onAdd, onDelete } = this.props;
    return (
      <div data-testid="personal-access-token-list-toolbar">
        <button disabled={isDisabled} onClick={onAdd}>
          Add Token
        </button>
        <button disabled={isDisabled} onClick={onDelete}>
          Delete
        </button>
      </div>
    );
  }
}
