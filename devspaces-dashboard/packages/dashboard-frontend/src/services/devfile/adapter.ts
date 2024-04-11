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

import devfileApi from '@/services/devfileApi';

export class DevfileAdapter {
  private _devfile: devfileApi.Devfile;

  constructor(devfile: devfileApi.Devfile) {
    this._devfile = devfile;
  }

  public static getAttributes(devfile: devfileApi.Devfile) {
    const attributes = {};
    if (devfile.schemaVersion?.startsWith('2.0')) {
      if (!devfile.metadata.attributes) {
        devfile.metadata.attributes = attributes;
      }
      return devfile.metadata.attributes;
    } else {
      if (!devfile.attributes) {
        devfile.attributes = attributes;
      }
      return devfile.attributes;
    }
  }

  get attributes() {
    return DevfileAdapter.getAttributes(this._devfile);
  }
}
