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

import { Button } from '@patternfly/react-core';
import * as React from 'react';

import { Props } from '..';

export class InputGroupExtended extends React.PureComponent<Props> {
  render(): React.ReactElement {
    const { children, onRemove, validated } = this.props;
    return (
      <div>
        {children}
        <span data-testid="validated">{validated}</span>
        <Button data-testid="button-remove" onClick={onRemove} />
      </div>
    );
  }
}
