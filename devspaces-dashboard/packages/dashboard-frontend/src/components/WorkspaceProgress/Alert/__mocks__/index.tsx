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

import { Props } from '..';

export class LoaderAlert extends React.PureComponent<Props> {
  render(): React.ReactNode {
    const { alertItems } = this.props;
    if (alertItems.length === 0) {
      return <></>;
    }

    const items = alertItems.map(item => {
      const actionLinks = item.actionCallbacks?.map(entry => {
        return (
          <button key={entry.title} onClick={() => entry.callback()}>
            {entry.title}
          </button>
        );
      });
      return (
        <div data-testid="loader-alert" key={item.key}>
          {actionLinks}
          <span data-testid="alert-title">{item.title}</span>
          <span data-testid="alert-body">{item.children}</span>
        </div>
      );
    });

    return <div data-testid="loader-alerts">{items}</div>;
  }
}
