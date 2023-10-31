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

import { Props, State } from '..';

export const SUBMIT_VALID_FORM = 'Submit Valid Form';
export const SUBMIT_INVALID_FORM = 'Submit Invalid Form';

export class AddModalForm extends React.PureComponent<Props, State> {
  public render(): React.ReactElement {
    const { onChange } = this.props;

    const validSshKey = {
      name: 'valid-ssh-key-name',
      creationTimestamp: undefined,
      resourceVersion: '123',
      key: 'key-data-1',
      keyPub: 'key-pub-data-1',
    };
    const invalidSshKey = {
      name: 'invalid+ssh+key+name',
      creationTimestamp: undefined,
      resourceVersion: '123',
      key: 'key-data-1',
      keyPub: 'key-pub-data-1',
    };

    return (
      <div data-testid="modal-form">
        <input
          data-testid="submit-invalid-form"
          type="button"
          value={SUBMIT_INVALID_FORM}
          onClick={() => onChange(validSshKey, false)}
        />
        <input
          data-testid="submit-valid-form"
          type="button"
          value={SUBMIT_VALID_FORM}
          onClick={() => onChange(invalidSshKey, true)}
        />
      </div>
    );
  }
}
