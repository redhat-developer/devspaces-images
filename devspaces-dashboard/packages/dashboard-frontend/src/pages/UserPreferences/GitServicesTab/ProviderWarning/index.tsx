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

import { WarningTriangleIcon } from '@patternfly/react-icons';
import React from 'react';

import { CheTooltip } from '@/components/CheTooltip';

type Props = {
  serverURI: string;
};
export default class ProviderWarning extends React.PureComponent<Props> {
  public render(): React.ReactElement {
    const content = (
      <>
        Provided API does not support the automatic token revocation. You can revoke it manually on
        &nbsp;
        <a
          href={this.props.serverURI}
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--pf-global--info-color--100)' }}
        >
          {this.props.serverURI}
        </a>
        .
      </>
    );

    return (
      <CheTooltip content={content}>
        <span style={{ marginLeft: '5px' }}>
          <WarningTriangleIcon color="var(--pf-global--warning-color--100)" />
        </span>
      </CheTooltip>
    );
  }
}
