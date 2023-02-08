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

import devfileApi from '../devfileApi';

/**
 * Returns a list of all workspace logs from the workspace status.
 */
export default function getWorkspaceLogs(workspace: devfileApi.DevWorkspace): string[] {
  if (workspace.status === undefined) {
    return [];
  }

  return (
    (workspace.status.conditions || [])
      .filter(condition => condition.message !== undefined)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .map(condition => condition.message!)
  );
}

/**
 * Filters the workspace logs for errors.
 */
export function getWorkspaceErrors(workspace: devfileApi.DevWorkspace): string[] {
  const errorRe = /^[1-9]{0,5} error occurred:/i;
  const logs = getWorkspaceLogs(workspace);

  return logs.filter(log => errorRe.test(log)).map(log => log.replace(errorRe, ''));
}
