/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
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
  ExclamationCircleIcon,
  InProgressIcon,
  ResourcesFullIcon,
} from '@patternfly/react-icons/dist/js/icons';
import React from 'react';
import { DevWorkspaceStatus, WorkspaceStatus } from '../../../services/helpers/types';
import { ColorType, StoppedIcon } from '../../WorkspaceStatusLabel';

import styles from './index.module.css';
import ReactTooltip from 'react-tooltip';

type Props = {
  status: string;
};

class WorkspaceIndicator extends React.PureComponent<Props> {
  public render(): React.ReactElement {
    const { status } = this.props;

    let color: ColorType;
    let icon: React.ReactElement;
    switch (status) {
      case DevWorkspaceStatus.STOPPED:
      case WorkspaceStatus.STOPPED:
        color = 'grey';
        icon = <StoppedIcon color={color} />;
        break;
      case DevWorkspaceStatus.RUNNING:
      case WorkspaceStatus.RUNNING:
        color = 'green';
        icon = <ResourcesFullIcon color={color} />;
        break;
      case DevWorkspaceStatus.FAILING:
        color = 'red';
        icon = <InProgressIcon className={styles.rotate} color={color} />;
        break;
      case DevWorkspaceStatus.FAILED:
      case WorkspaceStatus.ERROR:
        color = 'red';
        icon = <ExclamationCircleIcon color={color} />;
        break;
      case DevWorkspaceStatus.STARTING:
      case WorkspaceStatus.STARTING:
        color = '#0e6fe0';
        icon = <InProgressIcon className={styles.rotate} color={color} />;
        break;
      default:
        color = 'grey';
        icon = <InProgressIcon className={styles.rotate} color={color} />;
    }

    return (
      <>
        <span
          data-tip={status.toUpperCase()}
          className={styles.statusIndicator}
          data-testid="workspace-status-indicator"
        >
          {icon}
        </span>
        <ReactTooltip backgroundColor="black" textColor="white" effect="solid" />
      </>
    );
  }
}

export default WorkspaceIndicator;
