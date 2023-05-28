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

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import React from 'react';
import { Props } from '..';

export class PersonalAccessTokenAddEditModal extends React.PureComponent<Props> {
  render() {
    const { isEdit, isOpen, token, onSaveToken, onCloseModal } = this.props;

    if (!isOpen) {
      return null;
    }

    return (
      <div data-testid="modal-add-edit">
        <h1 data-testid="modal-title">{isEdit ? 'Edit' : 'Add'} Personal Access Token Modal</h1>
        <button data-testid="close-modal" onClick={() => onCloseModal()}>
          Close
        </button>
        <button data-testid="save-token" onClick={() => onSaveToken(token!)}>
          Submit
        </button>
      </div>
    );
  }
}
