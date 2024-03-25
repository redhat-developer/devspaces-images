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
import axios from 'axios';

import { dashboardBackendPrefix } from '@/services/backend-client/const';

export async function fetchData<T>(location: string): Promise<T> {
  try {
    const url = new URL(location);
    const response =
      url.origin === window.location.origin
        ? await axios.get(url.href)
        : await axios.post(`${dashboardBackendPrefix}/data/resolver`, {
            url: url.href,
          });
    return response?.data as T;
  } catch (e) {
    throw new Error(helpers.errors.getMessage(e));
  }
}
