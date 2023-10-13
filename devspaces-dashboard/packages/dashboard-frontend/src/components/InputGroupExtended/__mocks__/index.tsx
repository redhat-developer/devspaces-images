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

import { Button } from '@patternfly/react-core';
import * as React from 'react';

import { Props, State } from '..';

export class InputGroupExtended extends React.PureComponent<Props, State> {
  render(): React.ReactElement {
    const { children, onCancel, onSave, validated } = this.props;
    return (
      <div>
        {children}
        <span data-testid="validated">{validated}</span>
        <Button data-testid="button-save" onClick={onSave} />
        <Button data-testid="button-cancel" onClick={onCancel} />
      </div>
    );
  }
}
