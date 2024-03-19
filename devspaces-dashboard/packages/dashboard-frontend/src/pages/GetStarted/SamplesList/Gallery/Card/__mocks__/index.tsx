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

import { Props } from '@/pages/GetStarted/SamplesList/Gallery/Card';

export class SampleCard extends React.PureComponent<Props> {
  render(): React.ReactElement {
    const { metadata, onClick } = this.props;

    return (
      <div data-testid="sample-card">
        <div data-testid="sample-name">{metadata.displayName}</div>
        <button onClick={() => onClick()}>Select Sample</button>
      </div>
    );
  }
}
