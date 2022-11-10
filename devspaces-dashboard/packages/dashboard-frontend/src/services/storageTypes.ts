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

import { getEnvironment, isDevEnvironment } from './helpers/environment';
import { isDevworkspacesEnabled } from './helpers/devworkspace';

export enum StorageTypeTitle {
  async = 'Asynchronous',
  ephemeral = 'Ephemeral',
  persistent = 'Persistent',
  'per-user' = 'Per-user',
  'per-workspace' = 'Per-workspace',
}

export function toTitle(type: che.WorkspaceStorageType): string {
  if (!StorageTypeTitle[type]) {
    throw new Error(`Unknown storage type: "${type}"`);
  }
  return StorageTypeTitle[type];
}

export function getAvailable(settings: che.WorkspaceSettings): che.WorkspaceStorageType[] {
  if (isDevworkspacesEnabled(settings)) {
    return ['per-user', 'per-workspace', 'ephemeral'];
  }
  if (!settings['che.workspace.storage.available_types']) {
    const env = getEnvironment();
    if (isDevEnvironment(env)) {
      // running Dashboard in Che in dev mode needs for storage types to be stubbed
      return ['persistent'];
    }
    throw new Error('Unable to get available storage types');
  }
  const availableTypes = settings['che.workspace.storage.available_types'];
  return availableTypes.split(',') as che.WorkspaceStorageType[];
}

export function typeToAttributes(
  type: che.WorkspaceStorageType,
): che.WorkspaceDevfileAttributes | undefined {
  switch (type) {
    case 'persistent':
      return;
    case 'ephemeral':
      return {
        persistVolumes: 'false',
      };
    case 'async':
      return {
        asyncPersist: 'true',
        persistVolumes: 'false',
      };
  }
}

export function attributesToType(
  attrs: che.WorkspaceDevfileAttributes | undefined,
): che.WorkspaceStorageType {
  if (attrs?.persistVolumes === 'false') {
    if (attrs.asyncPersist === 'true') {
      return 'async';
    }
    return 'ephemeral';
  }
  return 'persistent';
}
