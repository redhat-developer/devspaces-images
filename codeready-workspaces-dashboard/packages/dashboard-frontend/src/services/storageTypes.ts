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

import { isDevfileV2 } from './devfileApi';
import { getEnvironment, isDevEnvironment } from './helpers/environment';
import { Devfile } from './workspace-adapter';

export enum StorageTypeTitle {
  async = 'Asynchronous',
  ephemeral = 'Ephemeral',
  persistent = 'Persistent',
}

export function toTitle(type: che.WorkspaceStorageType): string {
  if (!StorageTypeTitle[type]) {
    throw new Error(`Unknown storage type: "${type}"`);
  }
  return StorageTypeTitle[type];
}

export function fromTitle(title: string): che.WorkspaceStorageType {
  switch (title) {
    case StorageTypeTitle.async:
      return 'async';
    case StorageTypeTitle.ephemeral:
      return 'ephemeral';
    case StorageTypeTitle.persistent:
      return 'persistent';
    default:
      throw new Error(`Cannot get storage type for given title: "${title}"`);
  }
}

export function getAvailable(settings: che.WorkspaceSettings): che.WorkspaceStorageType[] {
  if (!settings || !settings['che.workspace.storage.available_types']) {
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

export function getPreferred(settings: che.WorkspaceSettings): che.WorkspaceStorageType {
  return settings['che.workspace.storage.preferred_type'] as che.WorkspaceStorageType;
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

export function updateDevfile(devfile: Devfile, storageType: che.WorkspaceStorageType): Devfile {
  if (isDevfileV2(devfile)) {
    return devfile;
  }

  const newDevfile = Object.assign({}, devfile) as che.WorkspaceDevfile;
  const attributes = newDevfile.attributes;
  switch (storageType) {
    case 'persistent':
      if (attributes) {
        delete attributes.persistVolumes;
        delete attributes.asyncPersist;
        if (Object.keys(attributes).length === 0) {
          delete newDevfile.attributes;
        }
      }
      break;
    case 'ephemeral':
      if (!attributes) {
        newDevfile.attributes = { persistVolumes: 'false' };
      } else {
        attributes.persistVolumes = 'false';
        delete attributes.asyncPersist;
      }
      break;
    case 'async':
      if (!attributes) {
        newDevfile.attributes = {
          persistVolumes: 'false',
          asyncPersist: 'true',
        };
      } else {
        attributes.persistVolumes = 'false';
        attributes.asyncPersist = 'true';
      }
      break;
  }

  return newDevfile;
}
