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

import { ProgressStepTitleIcon } from '@/components/WorkspaceProgress/StepTitle/Icon';
import styles from '@/components/WorkspaceProgress/StepTitle/index.module.css';

export type Props = PropsWithChildren<{
  className?: string;
  distance: -1 | 0 | 1 | undefined;
  hasChildren: boolean;
  isError: boolean;
  isWarning: boolean;
}>;

export class ProgressStepTitle extends React.Component<Props> {
  render(): React.ReactElement {
    const { children, className, hasChildren, distance, isError, isWarning } = this.props;

    let readiness = styles.ready;
    if (distance === 0) {
      readiness = styles.progress;
    } else if (isError) {
      readiness = styles.error;
    }

    const fullClassName = [readiness, className].filter(c => c).join(' ');

    // for step with children do not show in-progress spinner
    const dist = hasChildren && distance === 0 ? -1 : distance;

    return (
      <>
        <ProgressStepTitleIcon distance={dist} isError={isError} isWarning={isWarning} />
        <span data-testid="step-title" className={fullClassName}>
          {children}
        </span>
      </>
    );
  }
}
