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

import React, { PropsWithChildren } from 'react';
import { ProgressStepTitleIcon } from './Icon';

export type Props = PropsWithChildren<{
  className?: string;
  distance: -1 | 0 | 1 | undefined;
  isError: boolean;
  isWarning: boolean;
}>;

import styles from './index.module.css';

export class ProgressStepTitle extends React.Component<Props> {
  render(): React.ReactElement {
    const { children, className, distance, isError, isWarning } = this.props;

    let readiness = styles.ready;
    if (distance === 0) {
      readiness = isError ? styles.error : styles.progress;
    }

    const fullClassName = [readiness, className].filter(c => c).join(' ');

    return (
      <>
        <ProgressStepTitleIcon distance={distance} isError={isError} isWarning={isWarning} />
        <span data-testid="step-title" className={fullClassName}>
          {children}
        </span>
      </>
    );
  }
}
