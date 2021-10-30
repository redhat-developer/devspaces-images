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
import { helpers } from '@eclipse-che/common';

export async function findApi(apisApi: k8s.ApisApi, apiName: string, version?: string): Promise<boolean> {
  const resp = await apisApi.getAPIVersions();
  const groups = resp.body.groups;
  return groups.some((apiGroup: k8s.V1APIGroup) => {
    if (version) {
      return apiGroup.name === apiName
        && apiGroup.versions.some(versionGroup => versionGroup.version === version);
    }
    return apiGroup.name === apiName;
  });
}

class DevWorkspaceClientError extends Error {
  statusCode: number;

  constructor(message: string, name: string, statusCode: number) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
  }
}

export function createError(error: unknown, name: string, additionalMessage: string): DevWorkspaceClientError {
  const statusCode: number = helpers.errors.isKubeClientError(error) && error.statusCode ? error.statusCode : 500;
  const originErrorMessage = helpers.errors.getMessage(error);

  return new DevWorkspaceClientError(`${additionalMessage}: ${originErrorMessage}`, name, statusCode);
}
