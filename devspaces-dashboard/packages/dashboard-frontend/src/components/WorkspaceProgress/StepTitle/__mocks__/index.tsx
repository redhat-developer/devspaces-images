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
import { Props } from '../';

export class ProgressStepTitle extends React.Component<Props> {
  render(): React.ReactElement {
    const { children, distance, isError, isWarning } = this.props;

    let className = 'done';
    if (distance === 0) {
      className = isError ? 'error' : 'progress';
    }

    return (
      <div>
        {isError && <div data-testid="isError"></div>}
        {isWarning && <div data-testid="isWarning"></div>}
        <div data-testid="distance">{distance}</div>
        <span data-testid="step-title" className={className}>
          {children}
        </span>
      </div>
    );
  }
}
