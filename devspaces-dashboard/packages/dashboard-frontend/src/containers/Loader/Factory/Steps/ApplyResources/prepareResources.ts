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

import { safeDump } from 'js-yaml';
import { cloneDeep } from 'lodash';
import { DEVWORKSPACE_STORAGE_TYPE } from '../../../../../services/devfileApi/devWorkspace/spec';
import { DEVWORKSPACE_DEVFILE_SOURCE } from '../../../../../services/workspace-client/devworkspace/devWorkspaceClient';
import { DevWorkspaceResources } from '../../../../../store/DevfileRegistries';

export function prepareResources(
  _resources: DevWorkspaceResources,
  factoryId: string,
  storageType: che.WorkspaceStorageType | undefined,
): DevWorkspaceResources {
  const resources = cloneDeep(_resources);
  const [devWorkspace, devWorkspaceTemplate] = resources;

  // add the factoryId to the devfile source section
  const { metadata } = devWorkspace;
  if (!metadata.annotations) {
    metadata.annotations = {};
  }
  metadata.annotations[DEVWORKSPACE_DEVFILE_SOURCE] = safeDump({
    factory: { params: factoryId },
  });

  // set storage type attribute
  if (storageType === 'ephemeral') {
    if (!devWorkspace.spec.template.attributes) {
      devWorkspace.spec.template.attributes = {};
    }
    devWorkspace.spec.template.attributes[DEVWORKSPACE_STORAGE_TYPE] = storageType;
  } else if (devWorkspace.spec?.template?.attributes?.[DEVWORKSPACE_STORAGE_TYPE]) {
    delete devWorkspace.spec.template.attributes[DEVWORKSPACE_STORAGE_TYPE];
  }

  return [devWorkspace, devWorkspaceTemplate];
}
