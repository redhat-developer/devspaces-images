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

import { api, helpers } from '@eclipse-che/common';
import axios from 'axios';

import { dashboardBackendPrefix } from '@/services/backend-client/const';

export async function fetchResources(params: api.IDevWorkspaceResources): Promise<string> {
  try {
    const response = await axios.post(`${dashboardBackendPrefix}/devworkspace-resources`, params);
    return response.data;
  } catch (e) {
    const errorMessage = helpers.errors.getMessage(e);
    throw new Error(`Failed to fetch resources. ${errorMessage}`);
  }
}
