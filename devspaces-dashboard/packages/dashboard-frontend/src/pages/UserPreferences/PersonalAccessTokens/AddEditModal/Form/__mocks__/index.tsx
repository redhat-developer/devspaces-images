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

import { api } from '@eclipse-che/common';
import React from 'react';

import { Props, State } from '..';

export const SUBMIT_VALID_FORM = 'Submit Valid Form';
export const SUBMIT_INVALID_FORM = 'Submit Invalid Form';

export class AddEditModalForm extends React.PureComponent<Props, State> {
  public render(): React.ReactElement {
    const { onChange, token: personalAccessToken = {} as api.PersonalAccessToken } = this.props;

    return (
      <div data-testid="modal-form">
        <input
          data-testid="submit-invalid-form"
          type="button"
          value={SUBMIT_INVALID_FORM}
          onClick={() => onChange(personalAccessToken, false)}
        />
        <input
          data-testid="submit-valid-form"
          type="button"
          value={SUBMIT_VALID_FORM}
          onClick={() => onChange(personalAccessToken, true)}
        />
      </div>
    );
  }
}
