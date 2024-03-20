/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
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

import { Props } from '@/pages/UserPreferences/GitServices/List/StatusIcon';

export class GitServiceStatusIcon extends React.PureComponent<Props> {
  public render(): React.ReactElement {
    const { gitProvider } = this.props;

    return (
      <span data-testid="git-service-status-icon">
        <span>Authentication Status Icon for {gitProvider}</span>
      </span>
    );
  }
}
