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

import { IDevWorkspace } from '@eclipse-che/devworkspace-client';
import { DevWorkspaceStatus } from '../helpers/types';

export function getId(workspace: IDevWorkspace): string {
  if (workspace?.status?.devworkspaceId) {
    return  workspace.status.devworkspaceId;
  }

  let workspaceId = 'workspace';

  if (workspace.metadata.uid) {
    workspaceId += workspace.metadata.uid.split('-').splice(0,3).join('');
  }

  return workspaceId;
}

export function getStatus(workspace: IDevWorkspace): DevWorkspaceStatus {
  if (!workspace.status?.phase) {
    return workspace.spec.started ? DevWorkspaceStatus.STARTING : DevWorkspaceStatus.STOPPED;
  }

  return workspace.status.phase as DevWorkspaceStatus;
}
