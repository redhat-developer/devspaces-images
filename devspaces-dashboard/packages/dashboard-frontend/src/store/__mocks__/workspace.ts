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

import { WorkspaceStatus } from '../../services/helpers/types';

/**
 * @deprecated use CheWorkspaceBuilder instead
 */
export const createFakeCheWorkspace = (
  workspaceId: string,
  workspaceName: string,
  namespace = 'admin',
  status = WorkspaceStatus.STOPPED,
  runtime?: che.WorkspaceRuntime,
): che.Workspace => {
  if (runtime && status === WorkspaceStatus.STOPPED) {
    throw new Error(
      'Failed creating a stub workspace. Workspace runtime object is only combined with "RUNNING" status',
    );
  }
  return {
    id: workspaceId,
    attributes: {
      infrastructureNamespace: 'che',
    },
    status,
    devfile: {
      apiVersion: '1.0.0',
      metadata: {
        name: workspaceName,
      },
    },
    namespace,
    runtime: runtime,
  } as che.Workspace;
};

export const createFakeWorkspaceLogs = (
  workspaceId: string,
  logs: string[] = [],
): Map<string, string[]> => {
  const workspacesLogs = new Map<string, string[]>();
  if (logs.length > 0) {
    workspacesLogs.set(workspaceId, logs);
  }
  return workspacesLogs;
};
