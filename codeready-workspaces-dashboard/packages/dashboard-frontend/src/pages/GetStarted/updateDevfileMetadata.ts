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

import { isDevfileV2 } from '../../services/workspaceAdapter';
import { safeDump } from 'js-yaml';

export function updateDevfileMetadata(devfile: api.che.workspace.devfile.Devfile, meta?: che.DevfileMetaData): api.che.workspace.devfile.Devfile {
  if (isDevfileV2(devfile)) {
    // provide metadata about the origin of the devfile with DevWorkspace
    const devfileSource = safeDump(meta ? {
      sample: {
        registry: meta.registry,
        displayName: meta.displayName,
        location: meta.links?.v2,
      },
    } : {
        custom: {},
      });
    const metadata = devfile.metadata;
    if (!metadata.attributes) {
      metadata.attributes = {};
    }
    metadata.attributes['dw.metadata.annotations'] = { 'che.eclipse.org/devfile-source': devfileSource };
    return Object.assign({}, devfile, { metadata });
  }

  return devfile;
}
