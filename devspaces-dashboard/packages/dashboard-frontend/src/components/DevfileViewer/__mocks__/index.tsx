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

import { Props } from '@/components/DevfileViewer';

export class DevfileViewer extends React.PureComponent<Props> {
  public render(): React.ReactNode {
    const { isActive, isExpanded, value } = this.props;

    return (
      <div>
        Mock Devfile Viewer
        <span data-testid="devfile-viewer-is-active">{isActive.toString()}</span>
        <span data-testid="devfile-viewer-is-expanded">{isExpanded.toString()}</span>
        <span data-testid="devfile-viewer-value">{value}</span>
      </div>
    );
  }
}
