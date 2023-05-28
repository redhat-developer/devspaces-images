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
import common from '@eclipse-che/common';

/**
 * Fetches Che user ID from Che server.
 */
export async function fetchCheUserId(): Promise<string> {
  const url = '/api/user/id';
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (e) {
    throw new Error(common.helpers.errors.getMessage(e));
  }
}
