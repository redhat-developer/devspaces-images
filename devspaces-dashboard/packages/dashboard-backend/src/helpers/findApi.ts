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

import * as k8s from '@kubernetes/client-node';

export async function findApi(
  apisApi: k8s.ApisApi,
  apiName: string,
  version?: string,
): Promise<boolean> {
  const resp = await apisApi.getAPIVersions();
  const groups = resp.body.groups;
  return groups.some((apiGroup: k8s.V1APIGroup) => {
    if (version) {
      return (
        apiGroup.name === apiName &&
        apiGroup.versions.some(versionGroup => versionGroup.version === version)
      );
    }
    return apiGroup.name === apiName;
  });
}
