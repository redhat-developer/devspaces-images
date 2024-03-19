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

import { Props } from '..';

export default class TemporaryStorageSwitch extends React.PureComponent<Props> {
  render(): React.ReactNode {
    const { isTemporary } = this.props;
    return (
      <div>
        {isTemporary ? 'Temporary Storage On' : 'Temporary Storage Off'}
        <input
          type="checkbox"
          onClick={() => this.props.onChange(!isTemporary)}
          name="Toggle Temporary Storage"
        />
      </div>
    );
  }
}
