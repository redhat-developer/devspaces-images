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

import { Props } from '@/pages/GetStarted/SamplesList/Toolbar';

export default class SamplesListToolbar extends React.PureComponent<Props> {
  render(): React.ReactNode {
    const { isTemporary, onTemporaryStorageChange } = this.props;
    return (
      <div>
        <span>Samples List Toolbar</span>
        <span data-testid="isTemporary">{isTemporary ? 'true' : 'false'}</span>
        <button onClick={() => onTemporaryStorageChange(!isTemporary)}>Toggle isTemporary</button>
      </div>
    );
  }
}
