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

import { getMessage } from '@eclipse-che/common/lib/helpers/errors';
import * as k8s from '@kubernetes/client-node';

const projectApiGroup = 'project.openshift.io';

export async function isOpenShift(apisApi: k8s.ApisApi): Promise<boolean> {
  try {
    return findApi(apisApi, projectApiGroup);
  } catch (e) {
    throw new Error(`Can't evaluate target platform: ${getMessage(e)}`);
  }
}

async function findApi(apisApi: k8s.ApisApi, apiName: string, version?: string): Promise<boolean> {
  const resp = await apisApi.getAPIVersions();
  const groups = resp.body.groups;
  const filtered =
    groups.some((apiGroup: k8s.V1APIGroup) => {
      if (version) {
        return apiGroup.name === apiName
          && apiGroup.versions.some(versionGroup => versionGroup.version === version);
      }
      return apiGroup.name === apiName;
    });
  return filtered;
}
