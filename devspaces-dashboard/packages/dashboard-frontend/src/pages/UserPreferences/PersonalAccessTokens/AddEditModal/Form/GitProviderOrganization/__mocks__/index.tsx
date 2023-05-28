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

export const NEW_GIT_PROVIDER_ORGANIZATION_BUTTON = 'Submit Valid Git Provider Organization';
export const NEW_GIT_PROVIDER_ORGANIZATION = 'new-git-provider-organization';
export const INVALID_GIT_PROVIDER_ORGANIZATION_BUTTON = 'Submit Invalid Git Provider Organization';
export const INVALID_GIT_PROVIDER_ORGANIZATION = 'invalid-git-provider-organization';

export class GitProviderOrganization extends React.PureComponent<Props, State> {
  public render(): React.ReactElement {
    const { onChange } = this.props;

    return (
      <div data-testid="git-provider-organization">
        <input
          data-testid="submit-invalid-git-provider-organization"
          type="button"
          value={INVALID_GIT_PROVIDER_ORGANIZATION_BUTTON}
          onClick={() => onChange(INVALID_GIT_PROVIDER_ORGANIZATION, false)}
        />
        <input
          data-testid="submit-valid-git-provider-organization"
          type="button"
          value={NEW_GIT_PROVIDER_ORGANIZATION_BUTTON}
          onClick={() => onChange(NEW_GIT_PROVIDER_ORGANIZATION, true)}
        />
      </div>
    );
  }
}
