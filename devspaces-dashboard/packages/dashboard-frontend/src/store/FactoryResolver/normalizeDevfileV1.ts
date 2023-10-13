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

import { cloneDeep } from 'lodash';

import { DevfileAdapter } from '@/services/devfile/adapter';

export default function normalizeDevfileV1(
  devfile: che.WorkspaceDevfile,
  preferredStorageType: che.WorkspaceStorageType,
): che.WorkspaceDevfile {
  const newDevfile = cloneDeep(devfile);
  if (newDevfile.metadata.generateName) {
    newDevfile.metadata.generateName = newDevfile.metadata.generateName.toLowerCase();
  }
  if (newDevfile.metadata.name) {
    newDevfile.metadata.name = newDevfile.metadata.name.toLowerCase();
  }
  const devfileAdapter = new DevfileAdapter(newDevfile);
  devfileAdapter.storageType = preferredStorageType;

  return devfileAdapter.devfile as che.WorkspaceDevfile;
}
