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

import devfileApi, { isDevfileV2 } from '@/services/devfileApi';
import { DEVWORKSPACE_STORAGE_TYPE_ATTR } from '@/services/devfileApi/devWorkspace/spec/template';
import { attributesToType } from '@/services/storageTypes';

export type Devfile = che.WorkspaceDevfile | devfileApi.Devfile;

export class DevfileAdapter {
  private _devfile: Devfile;

  constructor(devfile: Devfile) {
    this._devfile = devfile;
  }

  public static getAttributesFromDevfileV2(devfile: devfileApi.Devfile) {
    let attributes = {};
    if (devfile.schemaVersion?.startsWith('2.0')) {
      if (!devfile.metadata.attributes) {
        devfile.metadata.attributes = attributes;
      } else {
        attributes = devfile.metadata.attributes;
      }
    } else {
      if (!devfile.attributes) {
        devfile.attributes = attributes;
      } else {
        attributes = devfile.attributes;
      }
    }

    return attributes;
  }

  get devfile(): Devfile {
    return this._devfile;
  }

  set storageType(type: che.WorkspaceStorageType) {
    if (isDevfileV2(this._devfile)) {
      const attributes = DevfileAdapter.getAttributesFromDevfileV2(this._devfile);
      if (type && type !== 'persistent') {
        attributes[DEVWORKSPACE_STORAGE_TYPE_ATTR] = type;
      } else {
        if (attributes[DEVWORKSPACE_STORAGE_TYPE_ATTR]) {
          delete attributes[DEVWORKSPACE_STORAGE_TYPE_ATTR];
        }
        if (Object.keys(attributes).length === 0) {
          if (this._devfile.attributes === attributes) {
            delete this._devfile.attributes;
          } else if (this._devfile.metadata.attributes === attributes) {
            delete this._devfile.metadata.attributes;
          }
        }
      }
    } else {
      const attributes = this._devfile.attributes;
      switch (type) {
        case 'persistent':
          if (attributes) {
            delete attributes.persistVolumes;
            delete attributes.asyncPersist;
            if (Object.keys(attributes).length === 0) {
              delete this._devfile.attributes;
            }
          }
          break;
        case 'ephemeral':
          if (!attributes) {
            this._devfile.attributes = { persistVolumes: 'false' };
          } else {
            attributes.persistVolumes = 'false';
            delete attributes.asyncPersist;
          }
          break;
        case 'async':
          if (!attributes) {
            this._devfile.attributes = {
              persistVolumes: 'false',
              asyncPersist: 'true',
            };
          } else {
            attributes.persistVolumes = 'false';
            attributes.asyncPersist = 'true';
          }
          break;
      }
    }
  }

  get storageType(): che.WorkspaceStorageType {
    if (isDevfileV2(this._devfile)) {
      let type = this._devfile.metadata.attributes?.[DEVWORKSPACE_STORAGE_TYPE_ATTR];
      if (type) {
        return type;
      }
      type = this._devfile.attributes?.[DEVWORKSPACE_STORAGE_TYPE_ATTR];
      if (type) {
        return type;
      }
      return 'persistent';
    }
    return attributesToType(this._devfile.attributes);
  }
}
