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

import devfileApi, { isDevfileV2 } from '../devfileApi';
import { DEVWORKSPACE_STORAGE_TYPE } from '../devfileApi/devWorkspace/spec';
import { attributesToType } from '../storageTypes';

export type Devfile = che.WorkspaceDevfile | devfileApi.Devfile;

export class DevfileAdapter {
  private _devfile: Devfile;

  constructor(devfile: Devfile) {
    this._devfile = devfile;
  }

  get devfile(): Devfile {
    return this._devfile;
  }

  set storageType(type: che.WorkspaceStorageType) {
    if (isDevfileV2(this._devfile)) {
      if (type === 'ephemeral') {
        if (this._devfile.schemaVersion === '2.0.0') {
          if (!this._devfile.metadata.attributes) {
            this._devfile.metadata.attributes = {};
          }
          this._devfile.metadata.attributes[DEVWORKSPACE_STORAGE_TYPE] = type;
        } else {
          // for devfiles version 2.1.0 and above
          if (!this._devfile.attributes) {
            this._devfile.attributes = {};
          }
          this._devfile.attributes[DEVWORKSPACE_STORAGE_TYPE] = type;
        }
      } else {
        if (this._devfile.metadata.attributes?.[DEVWORKSPACE_STORAGE_TYPE]) {
          delete this._devfile.metadata.attributes[DEVWORKSPACE_STORAGE_TYPE];
          if (Object.keys(this._devfile.metadata.attributes).length === 0) {
            delete this._devfile.metadata.attributes;
          }
        }
        if (this._devfile.attributes?.[DEVWORKSPACE_STORAGE_TYPE]) {
          delete this._devfile.attributes[DEVWORKSPACE_STORAGE_TYPE];
          if (Object.keys(this._devfile.attributes).length === 0) {
            delete this._devfile.attributes;
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
      let type = this._devfile.metadata.attributes?.[DEVWORKSPACE_STORAGE_TYPE];
      if (type === 'ephemeral') {
        return type;
      }
      type = this._devfile.attributes?.[DEVWORKSPACE_STORAGE_TYPE];
      if (type === 'ephemeral') {
        return type;
      }
      return 'persistent';
    }
    return attributesToType(this._devfile.attributes);
  }
}
