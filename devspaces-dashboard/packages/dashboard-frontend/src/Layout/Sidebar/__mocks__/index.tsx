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

import { Props } from '@/Layout/Sidebar';

export class Sidebar extends React.PureComponent<Props> {
  public render(): React.ReactElement {
    return (
      <div>
        Mock Sidebar component
        <span data-testid="isManaged">{this.props.isManaged ? 'true' : 'false'}</span>
        <span data-testid="isNavOpen">{this.props.isNavOpen ? 'true' : 'false'}</span>
      </div>
    );
  }
}
