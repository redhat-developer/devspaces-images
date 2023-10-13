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

import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InProgressIcon,
} from '@patternfly/react-icons';
import React from 'react';

import styles from '@/components/WorkspaceProgress/StepTitle/Icon/index.module.css';
import workspaceStatusLabelStyles from '@/components/WorkspaceStatusLabel/index.module.css';

type Props = {
  distance: -1 | 0 | 1 | undefined;
  isError: boolean;
  isWarning: boolean;
};

export class ProgressStepTitleIcon extends React.Component<Props> {
  render(): React.ReactElement {
    const { distance, isError, isWarning } = this.props;

    if (isError) {
      return (
        <ExclamationCircleIcon
          data-testid="step-failed-icon"
          className={`${styles.errorIcon} ${styles.stepIcon}`}
        />
      );
    }

    if (isWarning) {
      return (
        <ExclamationTriangleIcon
          data-testid="step-warning-icon"
          className={`${styles.warningIcon} ${styles.stepIcon}`}
        />
      );
    }

    // step isn't started
    if (distance === undefined || distance < 0) {
      return <></>;
    }

    // step is done
    if (distance > 0) {
      return (
        <CheckCircleIcon
          data-testid="step-done-icon"
          className={`${styles.successIcon} ${styles.stepIcon}`}
        />
      );
    }

    // step in progress
    return (
      <InProgressIcon
        data-testid="step-in-progress-icon"
        className={`${styles.inProgressIcon} ${workspaceStatusLabelStyles.rotate} ${styles.stepIcon}`}
      />
    );
  }
}
