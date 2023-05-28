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

export const NEW_GIT_PROVIDER_USERNAME_BUTTON = 'Submit Valid Git Provider Username';
export const NEW_GIT_PROVIDER_USERNAME = 'new-git-provider-username';
export const INVALID_GIT_PROVIDER_USERNAME_BUTTON = 'Submit Invalid Git Provider Username';
export const INVALID_GIT_PROVIDER_USERNAME = 'invalid-git-provider-username';

export class GitProviderUsername extends React.PureComponent<Props, State> {
  public render(): React.ReactElement {
    const { onChange } = this.props;

    return (
      <div data-testid="git-provider-username">
        <input
          data-testid="submit-invalid-git-provider-username"
          type="button"
          value={INVALID_GIT_PROVIDER_USERNAME_BUTTON}
          onClick={() => onChange(INVALID_GIT_PROVIDER_USERNAME, false)}
        />
        <input
          data-testid="submit-valid-git-provider-username"
          type="button"
          value={NEW_GIT_PROVIDER_USERNAME_BUTTON}
          onClick={() => onChange(NEW_GIT_PROVIDER_USERNAME, true)}
        />
      </div>
    );
  }
}
