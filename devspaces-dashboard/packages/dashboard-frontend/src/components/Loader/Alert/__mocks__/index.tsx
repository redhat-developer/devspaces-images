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

export class LoaderAlert extends React.PureComponent<Props, State> {
  render(): React.ReactNode {
    const { alertItem } = this.props;
    if (alertItem === undefined) {
      return <></>;
    }
    const actionLinks = alertItem.actionCallbacks?.map(entry => {
      return (
        <button key={entry.title} onClick={() => entry.callback()}>
          {entry.title}
        </button>
      );
    });
    return (
      <div data-testid="ide-loader-alert">
        {actionLinks}
        <span data-testid="alert-title">{alertItem.title}</span>
        <span data-testid="alert-body">{alertItem.children}</span>
      </div>
    );
  }
}
