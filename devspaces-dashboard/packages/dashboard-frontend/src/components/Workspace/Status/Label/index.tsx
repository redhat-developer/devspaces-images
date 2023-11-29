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

import { Label, LabelProps } from '@patternfly/react-core';
import React from 'react';

import { CheTooltip } from '@/components/CheTooltip';
import { getStatusIcon } from '@/components/Workspace/Status/getStatusIcon';
import styles from '@/components/Workspace/Status/index.module.css';
import {
  DeprecatedWorkspaceStatus,
  DevWorkspaceStatus,
  WorkspaceStatus,
} from '@/services/helpers/types';

type Props = {
  status: WorkspaceStatus | DevWorkspaceStatus | DeprecatedWorkspaceStatus;
};

export class WorkspaceStatusLabel extends React.PureComponent<Props> {
  render(): React.ReactElement {
    const { status } = this.props;

    let statusLabelColor: LabelProps['color'];
    switch (status) {
      case WorkspaceStatus.RUNNING:
      case DevWorkspaceStatus.RUNNING:
        statusLabelColor = 'green';
        break;
      case WorkspaceStatus.STARTING:
      case DevWorkspaceStatus.STARTING:
        statusLabelColor = 'blue';
        break;
      case DevWorkspaceStatus.FAILING:
      case WorkspaceStatus.ERROR:
      case DevWorkspaceStatus.FAILED:
      case 'Deprecated':
        statusLabelColor = 'orange';
        break;
      case WorkspaceStatus.STOPPED:
      case DevWorkspaceStatus.STOPPED:
      case WorkspaceStatus.STOPPING:
      case DevWorkspaceStatus.STOPPING:
      case DevWorkspaceStatus.TERMINATING:
        statusLabelColor = 'grey';
    }

    return (
      <CheTooltip content={status === 'Deprecated' ? 'Deprecated workspace' : status}>
        <Label className={styles.statusLabel} color={statusLabelColor} icon={getStatusIcon(status)}>
          {status}
        </Label>
      </CheTooltip>
    );
  }
}
