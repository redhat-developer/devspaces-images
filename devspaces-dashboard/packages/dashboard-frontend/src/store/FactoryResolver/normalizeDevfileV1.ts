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

import { updateDevfileStorageType } from '../../services/storageTypes';

export default function normalizeDevfileV1(
  devfile: che.WorkspaceDevfile,
  preferredStorageType: che.WorkspaceStorageType,
): che.WorkspaceDevfile {
  if (
    devfile?.attributes?.persistVolumes === undefined &&
    devfile?.attributes?.asyncPersist === undefined &&
    preferredStorageType
  ) {
    devfile = updateDevfileStorageType(devfile, preferredStorageType) as che.WorkspaceDevfile;
  }

  return devfile;
}
