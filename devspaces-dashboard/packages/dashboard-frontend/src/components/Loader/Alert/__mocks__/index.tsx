/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
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

export class LoaderAlert extends React.PureComponent<Props, State> {
  render(): React.ReactNode {
    const { alertItem, onRestart } = this.props;
    if (alertItem === undefined) {
      return <></>;
    }
    return (
      <div data-testid="ide-loader-alert">
        <button onClick={() => onRestart(false)}>reload</button>
        <button onClick={() => onRestart(true)}>reload-verbose</button>
        <span data-testid="alert-title">{alertItem.title}</span>
        <span data-testid="alert-body">{alertItem.children}</span>
      </div>
    );
  }
}
