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

import * as k8s from '@kubernetes/client-node';

export async function findApi(apisApi: k8s.ApisApi, apiName: string, version?: string): Promise<boolean> {
  try {
    const resp = await apisApi.getAPIVersions();
    const groups = resp.body.groups;
    const filtered =
      groups.filter((apiGroup: k8s.V1APIGroup) => {
        if (version) {
          return apiGroup.name === apiName && apiGroup.versions.filter(versionGroup => versionGroup.version === version).length > 0;
        }
        return apiGroup.name === apiName;
      })
        .length > 0;
    return Promise.resolve(filtered);
  } catch (e) {
    throw e;
  }
}
