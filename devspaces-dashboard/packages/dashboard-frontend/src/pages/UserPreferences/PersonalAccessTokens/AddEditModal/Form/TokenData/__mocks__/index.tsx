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

export const NEW_TOKEN_DATA_BUTTON = 'Submit Valid Token Data';
export const NEW_TOKEN_DATA = 'new-token-data';
export const INVALID_TOKEN_DATA_BUTTON = 'Submit Invalid Token Data';
export const INVALID_TOKEN_DATA = 'invalid-token-data';

export class TokenData extends React.PureComponent<Props, State> {
  public render(): React.ReactElement {
    const { onChange } = this.props;

    return (
      <div data-testid="token-data">
        <input
          data-testid="submit-invalid-token-data"
          type="button"
          value={INVALID_TOKEN_DATA_BUTTON}
          onClick={() => onChange(INVALID_TOKEN_DATA, false)}
        />
        <input
          data-testid="submit-valid-token-data"
          type="button"
          value={NEW_TOKEN_DATA_BUTTON}
          onClick={() => onChange(NEW_TOKEN_DATA, true)}
        />
      </div>
    );
  }
}
