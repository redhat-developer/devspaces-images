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

import axios from 'axios';
import common, { ClusterInfo } from '@eclipse-che/common';
import { prefix } from './const';

export async function fetchClusterInfo(): Promise<ClusterInfo> {
  try {
    const response = await axios.get(`${prefix}/cluster-info`);
    return response.data;
  } catch (e) {
    throw new Error(`Failed to fetch cluster information. ${common.helpers.errors.getMessage(e)}`);
  }
}
