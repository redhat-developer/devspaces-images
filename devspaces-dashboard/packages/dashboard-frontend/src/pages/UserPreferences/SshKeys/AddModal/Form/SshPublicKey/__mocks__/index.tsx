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

export const NEW_SSH_PUBLIC_KEY_BUTTON = 'Submit Valid SSH Public Key';
export const NEW_SSH_PUBLIC_KEY = 'new-ssh-public-key';
export const INVALID_SSH_PUBLIC_KEY_BUTTON = 'Submit Invalid SSH Public Key';
export const INVALID_SSH_PUBLIC_KEY = 'invalid-ssh-public-key';

export class SshPublicKey extends React.PureComponent<Props, State> {
  public render(): React.ReactElement {
    const { onChange } = this.props;

    return (
      <div data-testid="ssh-public-key">
        <input
          data-testid="submit-invalid-ssh-public-key"
          type="button"
          value={INVALID_SSH_PUBLIC_KEY_BUTTON}
          onClick={() => onChange(INVALID_SSH_PUBLIC_KEY, false)}
        />
        <input
          data-testid="submit-valid-ssh-public-key"
          type="button"
          value={NEW_SSH_PUBLIC_KEY_BUTTON}
          onClick={() => onChange(NEW_SSH_PUBLIC_KEY, true)}
        />
      </div>
    );
  }
}
