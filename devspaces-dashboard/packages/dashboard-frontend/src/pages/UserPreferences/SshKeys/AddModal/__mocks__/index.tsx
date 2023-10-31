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

import { api } from '@eclipse-che/common';
import React from 'react';

import { Props } from '..';

export const MODAL_ADD_TEST_ID = 'modal-add';
export const MODAL_ADD_TITLE_TEST_ID = 'modal-title';
export const MODAL_ADD_CLOSE_BUTTON_TEST_ID = 'close-modal-button';
export const MODAL_ADD_SUBMIT_BUTTON_TEST_ID = 'submit-keys-button';

export class SshKeysAddModal extends React.PureComponent<Props> {
  render() {
    const { isOpen, onSaveSshKey, onCloseModal } = this.props;

    if (!isOpen) {
      return null;
    }

    const sshKey: api.NewSshKey = {
      name: 'ssh-key-name',
      key: 'key-data-1',
      keyPub: 'key-pub-data-1',
    };

    return (
      <div data-testid={MODAL_ADD_TEST_ID}>
        <h1 data-testid={MODAL_ADD_TITLE_TEST_ID}>Add SSH Keys Modal</h1>
        <button data-testid={MODAL_ADD_CLOSE_BUTTON_TEST_ID} onClick={() => onCloseModal()}>
          Close
        </button>
        <button data-testid={MODAL_ADD_SUBMIT_BUTTON_TEST_ID} onClick={() => onSaveSshKey(sshKey)}>
          Submit
        </button>
      </div>
    );
  }
}
