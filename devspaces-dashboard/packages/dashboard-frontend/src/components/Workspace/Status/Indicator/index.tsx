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

import React from 'react';

import { CheTooltip } from '@/components/CheTooltip';
import { getStatusIcon } from '@/components/Workspace/Status/getStatusIcon';
import styles from '@/components/Workspace/Status/index.module.css';
import {
  DeprecatedWorkspaceStatus,
  DevWorkspaceStatus,
  WorkspaceStatus,
} from '@/services/helpers/types';

export type Props = {
  status: WorkspaceStatus | DevWorkspaceStatus | DeprecatedWorkspaceStatus;
};

export class WorkspaceStatusIndicator extends React.PureComponent<Props> {
  public render(): React.ReactElement {
    const { status } = this.props;

    const icon = getStatusIcon(status);

    const tooltip = status === 'Deprecated' ? 'Deprecated workspace' : status.toLocaleUpperCase();

    return (
      <CheTooltip content={tooltip}>
        <span
          className={styles.statusIndicator}
          data-testid="workspace-status-indicator"
          aria-label={`Workspace status is ${status}`}
        >
          {icon}
        </span>
      </CheTooltip>
    );
  }
}
