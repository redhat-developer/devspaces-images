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

import { Workspace } from '../../services/workspace-adapter';

export default function (
  workspaces: Workspace[],
  matchParams: { namespace: string; workspaceName: string },
): Workspace | undefined {
  return workspaces.find(
    w => w.name === matchParams.workspaceName && w.namespace === matchParams.namespace,
  );
}
