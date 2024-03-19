/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { cloneDeep } from 'lodash';

import { DevfileAdapter } from '@/services/devfile/adapter';
import { che } from '@/services/models';

const MAX_LENGTH = 63;

function getNormalizeValue(value: string): string {
  value = value.toLowerCase();

  if (value.length > MAX_LENGTH) {
    return value.substring(0, MAX_LENGTH - 1);
  }

  return value;
}

export default function normalizeDevfileV1(
  devfile: che.api.workspace.devfile.Devfile,
  preferredStorageType: che.WorkspaceStorageType,
): che.api.workspace.devfile.Devfile {
  const newDevfile = cloneDeep(devfile);
  if (newDevfile.metadata?.generateName) {
    newDevfile.metadata.generateName = getNormalizeValue(newDevfile.metadata.generateName);
  }
  if (newDevfile.metadata?.name) {
    newDevfile.metadata.name = getNormalizeValue(newDevfile.metadata.name);
  }
  if (newDevfile.projects?.length) {
    newDevfile.projects.forEach(project => {
      if (project.name) {
        project.name = getNormalizeValue(project.name);
      }
    });
  }
  const devfileAdapter = new DevfileAdapter(newDevfile);
  devfileAdapter.storageType = preferredStorageType;

  return devfileAdapter.devfile as che.api.workspace.devfile.Devfile;
}
