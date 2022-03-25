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

import { Devfile } from '../workspace-adapter';
import devfileApi from '../devfileApi';
import { DevfileAdapter } from '../devfile/adapter';

export function getDefaultDevfileV1(
  preferredStorageType: che.WorkspaceStorageType,
  generateName = 'wksp-',
): che.WorkspaceDevfile {
  const devfileAdapter = new DevfileAdapter({
    apiVersion: '1.0.0',
    metadata: {
      generateName,
    },
  } as che.WorkspaceDevfile);
  devfileAdapter.storageType = preferredStorageType;

  return devfileAdapter.devfile as che.WorkspaceDevfile;
}

export function getDefaultDevfileV2(name = 'wksp'): devfileApi.Devfile {
  return {
    schemaVersion: '2.1.0',
    metadata: {
      name,
    },
  } as devfileApi.Devfile;
}

export default function getDefaultDevfile(
  isDevworkspacesEnabled: boolean,
  preferredStorageType: che.WorkspaceStorageType,
  generateName = 'wksp-',
): Devfile {
  if (isDevworkspacesEnabled) {
    return getDefaultDevfileV2(generateName);
  } else {
    return getDefaultDevfileV1(preferredStorageType, generateName);
  }
}
