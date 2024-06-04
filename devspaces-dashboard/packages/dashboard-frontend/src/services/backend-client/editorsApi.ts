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

import { api, helpers } from '@eclipse-che/common';

import { AxiosWrapper } from '@/services/axios-wrapper/axiosWrapper';
import { dashboardBackendPrefix } from '@/services/backend-client/const';

export async function fetchEditors(): Promise<api.IEditors> {
  try {
    const response = await AxiosWrapper.createToRetryMissedBearerTokenError().get(
      `${dashboardBackendPrefix}/editors`,
    );
    return response.data;
  } catch (e) {
    throw new Error(`Failed to fetch editors. ${helpers.errors.getMessage(e)}`);
  }
}
