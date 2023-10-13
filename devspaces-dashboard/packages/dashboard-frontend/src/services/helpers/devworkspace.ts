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

import * as devfileApi from '@/services/devfileApi/devfileApi';

/**
 * Check to see if the workspace is a web terminal
 * @param workspace The workspace you want to check
 */
export function isWebTerminal(workspace: devfileApi.DevWorkspace): boolean {
  const labels = workspace?.metadata?.labels;
  return labels?.['console.openshift.io/terminal'] !== undefined;
}
