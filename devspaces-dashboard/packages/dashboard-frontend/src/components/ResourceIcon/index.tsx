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

import { Tooltip } from '@patternfly/react-core';
import React from 'react';
import styles from './index.module.css';

export type Props = {
  kind: string;
};

export class ResourceIcon extends React.PureComponent<Props> {
  public render(): React.ReactElement {
    const { kind } = this.props;
    const iconText = kind.replace(/[a-z]/g, '');

    return (
      <Tooltip aria="none" aria-live="polite" content={kind}>
        <span className={styles.icon}>{iconText}</span>
      </Tooltip>
    );
  }
}
