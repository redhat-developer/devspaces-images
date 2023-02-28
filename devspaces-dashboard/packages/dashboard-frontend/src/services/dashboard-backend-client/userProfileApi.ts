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

import common, { api } from '@eclipse-che/common';
import axios from 'axios';
import { prefix } from './const';

/**
 * Returns object with user profile data.
 */
export async function fetchUserProfile(namespace: string): Promise<api.IUserProfile> {
  const url = `${prefix}/userprofile/${namespace}`;
  try {
    const response = await axios.get<api.IUserProfile>(url);
    return response.data;
  } catch (e) {
    throw new Error(
      `Failed to fetch the user profile data. ${common.helpers.errors.getMessage(e)}`,
    );
  }
}
