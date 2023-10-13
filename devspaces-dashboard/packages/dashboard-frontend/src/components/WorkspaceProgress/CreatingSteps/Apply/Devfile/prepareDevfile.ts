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

import { dump, load } from 'js-yaml';
import { cloneDeep } from 'lodash';

import { DevfileAdapter } from '@/services/devfile/adapter';
import devfileApi from '@/services/devfileApi';
import { DEVWORKSPACE_STORAGE_TYPE_ATTR } from '@/services/devfileApi/devWorkspace/spec/template';
import { generateWorkspaceName } from '@/services/helpers/generateName';
import sanitizeName from '@/services/helpers/sanitizeName';
import {
  DEVWORKSPACE_DEVFILE_SOURCE,
  DEVWORKSPACE_METADATA_ANNOTATION,
} from '@/services/workspace-client/devworkspace/devWorkspaceClient';

export type FactorySource = { factory?: { params: string } };

export function prepareDevfile(
  _devfile: devfileApi.Devfile,
  factoryId: string,
  storageType: che.WorkspaceStorageType | undefined,
  appendSuffix: boolean,
): devfileApi.Devfile {
  const devfile = cloneDeep(_devfile);
  const attributes = DevfileAdapter.getAttributesFromDevfileV2(devfile);
  if (
    !attributes[DEVWORKSPACE_METADATA_ANNOTATION] ||
    typeof attributes[DEVWORKSPACE_METADATA_ANNOTATION] !== 'object'
  ) {
    attributes[DEVWORKSPACE_METADATA_ANNOTATION] = {};
  }
  const dwMetadataAnnotations = attributes[DEVWORKSPACE_METADATA_ANNOTATION];
  const devfileSourceYaml = dwMetadataAnnotations[DEVWORKSPACE_DEVFILE_SOURCE];
  let devfileSource = devfileSourceYaml ? load(devfileSourceYaml) : {};
  if (typeof devfileSource !== 'object') {
    devfileSource = {};
  }
  (devfileSource as FactorySource).factory = { params: factoryId };
  attributes[DEVWORKSPACE_METADATA_ANNOTATION][DEVWORKSPACE_DEVFILE_SOURCE] = dump(devfileSource);

  // update `metadata.name` in accordance to the policy
  if (devfile.metadata.generateName) {
    devfile.metadata.name = generateWorkspaceName(devfile.metadata.generateName);
    delete devfile.metadata.generateName;
  } else if (appendSuffix) {
    devfile.metadata.name = generateWorkspaceName(devfile.metadata.name);
  }
  // sanitize the workspace name
  devfile.metadata.name = sanitizeName(devfile.metadata.name);

  // propagate storage type
  if (storageType === 'ephemeral') {
    attributes[DEVWORKSPACE_STORAGE_TYPE_ATTR] = 'ephemeral';
  }

  return devfile;
}
