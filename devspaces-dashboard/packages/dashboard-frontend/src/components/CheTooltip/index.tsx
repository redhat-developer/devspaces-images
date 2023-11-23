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

import { Tooltip, TooltipProps } from '@patternfly/react-core';
import React from 'react';

export type Props = Omit<TooltipProps, 'ref'>;

export class CheTooltip extends React.PureComponent<Props> {
  public render(): React.ReactElement {
    return (
      <Tooltip
        isContentLeftAligned={true}
        style={{ border: '1px solid', borderRadius: '3px', opacity: '0.9' }}
        {...this.props}
      />
    );
  }
}
