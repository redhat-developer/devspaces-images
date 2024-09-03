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

import { helpers } from '@eclipse-che/common';
import { AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios';

import { AxiosWrapper } from '@/services/axios-wrapper/axiosWrapper';
import { dashboardBackendPrefix } from '@/services/backend-client/const';

export type Headers = RawAxiosResponseHeaders | AxiosResponseHeaders;

export async function isRunningDevWorkspacesClusterLimitExceeded(): Promise<boolean> {
  try {
    const response = await AxiosWrapper.createToRetryAnyErrors().get(
      `${dashboardBackendPrefix}/devworkspace/running-workspaces-cluster-limit-exceeded`,
    );
    return response.data;
  } catch (e) {
    throw new Error(
      `Failed to verify if the running DevWorkspace cluster limit has been exceeded. ${helpers.errors.getMessage(e)}`,
    );
  }
}
