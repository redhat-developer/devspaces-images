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

import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import React from 'react';

import styles from '@/Layout/Navigation/RecentItem/TitleWithHover/index.module.css';

export type Props = {
  isActive: boolean;
  text: string;
};

export class TitleWithHover extends React.Component<Props> {
  public render(): React.ReactElement {
    const { text } = this.props;

    const className = styles.titleHover + ' ' + (this.props.isActive ? styles.active : '');

    return (
      <Tooltip
        isContentLeftAligned={true}
        className={className}
        content={text}
        position={TooltipPosition.topStart}
        distance={-31}
        maxWidth="50rem"
      >
        <span>{text}</span>
      </Tooltip>
    );
  }
}
