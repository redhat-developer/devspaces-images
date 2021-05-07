/*
 * Copyright (c) 2018-2020 Red Hat, Inc.
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

/**
 * Check to see if the workspace is currently being deleted
 * @param workspace The workspace you want to check
 */
export function isDeleting(workspace: IDevWorkspace): boolean {
  return workspace.metadata.deletionTimestamp !== undefined;
}

/**
 * Check to see if the workspace is a web terminal
 * @param workspaceOrDevfile The workspace or devfile you want to check
 */
export function isWebTerminal(workspaceOrDevfile: che.Workspace | api.che.workspace.devfile.Devfile): boolean {
  return !!(workspaceOrDevfile as any).metadata.labels['console.openshift.io/terminal'];
}
