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

import { Icon } from '@patternfly/react-core';
import {
  ExclamationTriangleIcon,
  InProgressIcon,
  ResourcesFullIcon,
} from '@patternfly/react-icons';
import React from 'react';

import styles from '@/components/Workspace/Status/index.module.css';
import { greyCssVariable, StoppedIcon } from '@/components/Workspace/Status/StoppedIcon';
import { DevWorkspaceStatus, WorkspaceStatus } from '@/services/helpers/types';

export function getStatusIcon(status: string) {
  let icon: React.ReactElement;
  switch (status) {
    case DevWorkspaceStatus.STOPPED:
    case WorkspaceStatus.STOPPED:
      icon = (
        <Icon isInline>
          <StoppedIcon />
        </Icon>
      );
      break;
    case DevWorkspaceStatus.RUNNING:
    case WorkspaceStatus.RUNNING:
      icon = (
        <Icon status="success" isInline>
          <ResourcesFullIcon />
        </Icon>
      );
      break;
    case DevWorkspaceStatus.FAILING:
      icon = (
        <Icon status="warning" isInline>
          <InProgressIcon className={styles.rotate} />
        </Icon>
      );
      break;
    case DevWorkspaceStatus.STARTING:
    case WorkspaceStatus.STARTING:
      icon = (
        <Icon status="info" isInline>
          <InProgressIcon className={styles.rotate} />
        </Icon>
      );
      break;
    case DevWorkspaceStatus.FAILED:
    case WorkspaceStatus.ERROR:
    case 'Deprecated':
      icon = (
        <Icon status="warning" isInline>
          <ExclamationTriangleIcon />
        </Icon>
      );
      break;
    default:
      icon = (
        <Icon isInline>
          <InProgressIcon className={styles.rotate} color={greyCssVariable} />
        </Icon>
      );
  }
  return icon;
}
