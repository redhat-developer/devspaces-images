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

export const NEW_SSH_PRIVATE_KEY_BUTTON = 'Submit Valid SSH Private Key';
export const NEW_SSH_PRIVATE_KEY = 'new-ssh-private-key';
export const INVALID_SSH_PRIVATE_KEY_BUTTON = 'Submit Invalid SSH Private Key';
export const INVALID_SSH_PRIVATE_KEY = 'invalid-ssh-private-key';

export class SshPrivateKey extends React.PureComponent<Props, State> {
  public render(): React.ReactElement {
    const { onChange } = this.props;

    return (
      <div data-testid="ssh-private-key">
        <input
          data-testid="submit-invalid-ssh-private-key"
          type="button"
          value={INVALID_SSH_PRIVATE_KEY_BUTTON}
          onClick={() => onChange(INVALID_SSH_PRIVATE_KEY, false)}
        />
        <input
          data-testid="submit-valid-ssh-private-key"
          type="button"
          value={NEW_SSH_PRIVATE_KEY_BUTTON}
          onClick={() => onChange(NEW_SSH_PRIVATE_KEY, true)}
        />
      </div>
    );
  }
}
