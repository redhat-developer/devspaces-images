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

import { LoaderTab } from '@/services/helpers/types';

import { Props } from '..';

export class LoaderPage extends React.PureComponent<Props> {
  render(): React.ReactNode {
    const { workspace, tabParam, onTabChange } = this.props;
    return (
      <div data-testid="loader-page">
        <div data-testid="loader-tab">{tabParam}</div>
        <button data-testid="tab-button" onClick={() => onTabChange(LoaderTab.Events)} />
        <div data-testid="workspace">{workspace?.name || 'unknown'}</div>
      </div>
    );
  }
}
