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

import { safeDump, safeLoad } from 'js-yaml';
import { cloneDeep } from 'lodash';
import {
  DEVWORKSPACE_DEVFILE_SOURCE,
  DEVWORKSPACE_METADATA_ANNOTATION,
} from '../../../../../../services/workspace-client/devworkspace/devWorkspaceClient';
import { DEVWORKSPACE_STORAGE_TYPE } from '../../../../../../services/devfileApi/devWorkspace/spec';
import devfileApi from '../../../../../../services/devfileApi';
import { generateWorkspaceName } from '../../../../../../services/helpers/generateName';

export type FactorySource = { factory?: { params: string } };

export function prepareDevfile(
  _devfile: devfileApi.Devfile,
  factoryId: string,
  storageType: che.WorkspaceStorageType | undefined,
  appendSuffix: boolean,
): devfileApi.Devfile {
  const devfile = cloneDeep(_devfile);

  // set factory ID
  if (!devfile.metadata.attributes) {
    devfile.metadata.attributes = {};
  }
  if (
    !devfile.metadata.attributes[DEVWORKSPACE_METADATA_ANNOTATION] ||
    typeof devfile.metadata.attributes[DEVWORKSPACE_METADATA_ANNOTATION] !== 'object'
  ) {
    devfile.metadata.attributes[DEVWORKSPACE_METADATA_ANNOTATION] = {};
  }
  const dwMetadataAnnotations = devfile.metadata.attributes[DEVWORKSPACE_METADATA_ANNOTATION];
  const devfileSourceYaml = dwMetadataAnnotations[DEVWORKSPACE_DEVFILE_SOURCE];
  let devfileSource = devfileSourceYaml ? safeLoad(devfileSourceYaml) : {};
  if (typeof devfileSource !== 'object') {
    devfileSource = {};
  }
  (devfileSource as FactorySource).factory = { params: factoryId };
  devfile.metadata.attributes[DEVWORKSPACE_METADATA_ANNOTATION][DEVWORKSPACE_DEVFILE_SOURCE] =
    safeDump(devfileSource);

  // update `metadata.name` in accordance to the policy
  if (devfile.metadata.generateName) {
    devfile.metadata.name = generateWorkspaceName(devfile.metadata.generateName);
    delete devfile.metadata.generateName;
  } else if (appendSuffix) {
    devfile.metadata.name = generateWorkspaceName(devfile.metadata.name);
  }

  // propagate storage type
  if (storageType === 'ephemeral') {
    if (devfile.schemaVersion === '2.0.0') {
      devfile.metadata.attributes[DEVWORKSPACE_STORAGE_TYPE] = 'ephemeral';
    } else {
      // for devfiles version 2.1.0 and above
      if (!devfile.attributes) {
        devfile.attributes = {};
      }
      devfile.attributes[DEVWORKSPACE_STORAGE_TYPE] = 'ephemeral';
    }
  }

  return devfile;
}
