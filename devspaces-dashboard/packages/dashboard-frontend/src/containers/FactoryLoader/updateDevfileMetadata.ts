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

import { isDevfileV2 } from '../../services/devfileApi';
import { safeDump, safeLoad } from 'js-yaml';
import {
  DEVWORKSPACE_DEVFILE_SOURCE,
  DEVWORKSPACE_METADATA_ANNOTATION,
} from '../../services/workspace-client/devworkspace/devWorkspaceClient';
import { CreatePolicy } from './index';
import getRandomString from '../../services/helpers/random';
import { DEVWORKSPACE_STORAGE_TYPE } from '../../services/devfileApi/devWorkspace/spec';

export type FactorySource = { factory?: { params: string } };

export default function updateDevfileMetadata(
  devfile: api.che.workspace.devfile.Devfile,
  factoryParams: string,
  createPolicy: CreatePolicy,
  storageType?: che.WorkspaceStorageType,
): api.che.workspace.devfile.Devfile {
  if (isDevfileV2(devfile)) {
    const metadata = devfile.metadata;
    if (!metadata.attributes) {
      metadata.attributes = {};
    }
    const dwMetadataAnnotations = metadata.attributes[DEVWORKSPACE_METADATA_ANNOTATION];
    let devfileSource = dwMetadataAnnotations
      ? dwMetadataAnnotations[DEVWORKSPACE_DEVFILE_SOURCE]
      : undefined;
    let devfileSourceObj = devfileSource ? safeLoad(devfileSource) : {};
    if (typeof devfileSourceObj !== 'object') {
      devfileSourceObj = {};
    }
    (devfileSourceObj as FactorySource).factory = { params: factoryParams };
    devfileSource = safeDump(devfileSourceObj);
    if (!metadata.attributes[DEVWORKSPACE_METADATA_ANNOTATION]) {
      metadata.attributes[DEVWORKSPACE_METADATA_ANNOTATION] = {};
    }
    metadata.attributes[DEVWORKSPACE_METADATA_ANNOTATION][DEVWORKSPACE_DEVFILE_SOURCE] =
      devfileSource;
    if (createPolicy !== 'peruser' && metadata.name) {
      metadata.name = `${metadata.name}-${getRandomString(4).toLowerCase()}`;
    }

    if (storageType === 'ephemeral') {
      if (devfile.schemaVersion === '2.0.0') {
        metadata.attributes[DEVWORKSPACE_STORAGE_TYPE] = 'ephemeral';
      } else {
        // for devfiles version 2.1.0 and above
        if (!devfile.attributes) {
          devfile.attributes = {};
        }
        devfile.attributes[DEVWORKSPACE_STORAGE_TYPE] = 'ephemeral';
      }
    }

    return Object.assign({}, devfile, { metadata });
  }

  return devfile;
}
