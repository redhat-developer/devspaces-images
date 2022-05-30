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

import { Workspace } from '../workspace-adapter';
import { WorkspacesLogs } from './types';

export function filterErrorLogs(workspacesLogs: WorkspacesLogs, workspace: Workspace): string {
  const errorRe = workspace.isDevWorkspace ? /^[1-9]{0,5} error occurred:/i : /^Error: /i;
  const wsLogs = workspacesLogs.get(workspace.uid) || [];

  const errorLogs: string[] = [];
  wsLogs.forEach(e => {
    if (errorRe.test(e)) {
      const message = e.replace(errorRe, '');
      errorLogs.push(message);
    }
  });
  return errorLogs.join('\n');
}
