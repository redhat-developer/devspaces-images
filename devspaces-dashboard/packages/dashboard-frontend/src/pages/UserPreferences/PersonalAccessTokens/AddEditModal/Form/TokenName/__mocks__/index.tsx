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

export const NEW_TOKEN_NAME_BUTTON = 'Submit Valid Token Name';
export const NEW_TOKEN_NAME = 'new-token-name';
export const INVALID_TOKEN_NAME_BUTTON = 'Submit Invalid Token Name';
export const INVALID_TOKEN_NAME = 'invalid-token-name';

export class TokenName extends React.PureComponent<Props, State> {
  public render(): React.ReactElement {
    const { onChange } = this.props;

    return (
      <div data-testid="token-name">
        <input
          data-testid="submit-invalid-token-name"
          type="button"
          value={INVALID_TOKEN_NAME_BUTTON}
          onClick={() => onChange(INVALID_TOKEN_NAME, false)}
        />
        <input
          data-testid="submit-valid-token-name"
          type="button"
          value={NEW_TOKEN_NAME_BUTTON}
          onClick={() => onChange(NEW_TOKEN_NAME, true)}
        />
      </div>
    );
  }
}
