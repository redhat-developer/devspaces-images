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

import { safeLoad } from 'js-yaml';
import { isCheWorkspace, Workspace } from '../../../../services/workspace-adapter';
import { DEVWORKSPACE_DEVFILE_SOURCE } from '../../../../services/workspace-client/devworkspace/devWorkspaceClient';
import { FactorySource } from './ApplyDevfile/prepareDevfile';
import { PoliciesCreate } from '../types';

export function findTargetWorkspace(
  allWorkspaces: Workspace[],
  factoryId: string,
  policiesCreate: PoliciesCreate,
  newWorkspaceName?: string,
): Workspace | undefined {
  return allWorkspaces.find(workspace => {
    if (isCheWorkspace(workspace.ref)) {
      return false;
    }

    const devWorkspace = workspace.ref;
    const workspaceFactorySourceYaml =
      devWorkspace.metadata.annotations?.[DEVWORKSPACE_DEVFILE_SOURCE];
    if (!workspaceFactorySourceYaml) {
      return false;
    }

    const workspaceFactorySource = getFactorySource(workspaceFactorySourceYaml);
    const sameFactoryId = workspaceFactorySource.factory?.params === factoryId;
    if (policiesCreate === 'perclick') {
      return sameFactoryId && workspace.name === newWorkspaceName;
    } else {
      return sameFactoryId;
    }
  });
}

const sources = new Map<string, FactorySource>();
function getFactorySource(sourceYaml: string): FactorySource {
  if (sources.has(sourceYaml) === false) {
    const source = safeLoad(sourceYaml) as FactorySource;
    sources.set(sourceYaml, source);
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return sources.get(sourceYaml)!;
}
