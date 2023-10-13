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

import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { WarningTriangleIcon } from '@patternfly/react-icons';
import React from 'react';

type Props = {
  warning: React.ReactNode;
};

export default class ProviderWarning extends React.PureComponent<Props> {
  public render(): React.ReactElement {
    return (
      <Tooltip
        exitDelay={3000}
        isContentLeftAligned={true}
        position={TooltipPosition.right}
        content={this.props.warning}
        style={{ border: '1px solid', borderRadius: '3px', opacity: '0.9' }}
      >
        <WarningTriangleIcon
          color="var(--pf-global--warning-color--100)"
          style={{ verticalAlign: 'text-top', margin: '2px 5px' }}
        />
      </Tooltip>
    );
  }
}
