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

import { getAxiosInstance } from '@/services/axios-wrapper/getAxiosInstance';
import { BrandingData } from '@/services/bootstrap/branding.constant';

export async function fetchBranding(url: string): Promise<BrandingData> {
  const axiosInstance = getAxiosInstance();
  try {
    const response = await axiosInstance.get<BrandingData>(url);
    return response.data;
  } catch (e) {
    throw new Error(`Failed to fetch branding data by URL: ${url}`);
  }
}
