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

export const NEW_GIT_PROVIDER_ENDPOINT_BUTTON = 'Submit Valid Git Provider Endpoint';
export const NEW_GIT_PROVIDER_ENDPOINT = 'new-git-provider-endpoint';
export const INVALID_GIT_PROVIDER_ENDPOINT_BUTTON = 'Submit Invalid Git Provider Endpoint';
export const INVALID_GIT_PROVIDER_ENDPOINT = 'invalid-git-provider-endpoint';

export class GitProviderEndpoint extends React.PureComponent<Props, State> {
  public render(): React.ReactElement {
    const { onChange } = this.props;

    return (
      <div data-testid="git-provider-endpoint">
        <input
          data-testid="submit-invalid-git-provider-endpoint"
          type="button"
          value={INVALID_GIT_PROVIDER_ENDPOINT_BUTTON}
          onClick={() => onChange(INVALID_GIT_PROVIDER_ENDPOINT, false)}
        />
        <input
          data-testid="submit-valid-git-provider-endpoint"
          type="button"
          value={NEW_GIT_PROVIDER_ENDPOINT_BUTTON}
          onClick={() => onChange(NEW_GIT_PROVIDER_ENDPOINT, true)}
        />
      </div>
    );
  }
}
