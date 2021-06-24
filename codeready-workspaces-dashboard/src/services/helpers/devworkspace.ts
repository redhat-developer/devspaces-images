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

/**
 * Check to see if the workspace is a web terminal
 * @param workspaceOrDevfile The workspace or devfile you want to check
 */
export function isWebTerminal(workspaceOrDevfile: che.Workspace | api.che.workspace.devfile.Devfile): boolean {
  return !!workspaceOrDevfile?.metadata?.labels['console.openshift.io/terminal'];
}
