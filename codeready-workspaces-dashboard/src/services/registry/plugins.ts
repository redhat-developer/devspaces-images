/*
 * Copyright (c) 2018-2020 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import axios from 'axios';

// create new instance of `axios` to avoid adding an authorization header
const axiosInstance = axios.create();

export async function fetchPlugins(registryUrl: string, headers?: { [name: string]: string | undefined; }): Promise<che.Plugin[]> {
  try {
    const response = await axiosInstance.request({
      'method': 'GET',
      'url': `${registryUrl}/plugins/`,
      'headers': headers ? headers : { 'Authorization': undefined }
    });
    return response.data as che.Plugin[];
  } catch (e) {
    throw new Error('Failed to fetch workspace settings, ' + e);
  }
}
