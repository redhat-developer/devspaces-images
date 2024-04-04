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

import { Label } from '@patternfly/react-core';
import React from 'react';

import styles from '@/components/TagLabel/index.module.css';

export type Props = {
  text: string;
  type: 'version' | 'tag' | 'placeholder';
};

export class TagLabel extends React.PureComponent<Props> {
  public render(): React.ReactElement {
    const { text } = this.props;

    const className = `${styles.label} ${this.props.type === 'tag' ? styles.tag : styles.version}`;

    const color = this.props.type === 'tag' ? 'orange' : 'blue';

    return (
      <Label className={className} variant="outline" color={color}>
        {text}
      </Label>
    );
  }
}
