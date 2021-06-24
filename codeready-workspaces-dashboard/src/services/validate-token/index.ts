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

import axios from 'axios';

export async function validateMachineToken(workspaceId: string, machineToken: string): Promise<void> {
  if (!machineToken) {
    throw new Error('Failed to validate machine token');
  }
  try {
    await axios({
      method: 'GET',
      url: `/api/workspace/${workspaceId}`,
      headers: {
        'Authorization': `Bearer ${machineToken}`
      }
    });
  } catch (e) {
    if (e.status !== 304) {
      throw new Error('Failed to validate machine token, ' + e);
    }
  }
}
