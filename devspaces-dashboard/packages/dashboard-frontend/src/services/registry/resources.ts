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

import common from '@eclipse-che/common';
import { loadAll } from 'js-yaml';
import devfileApi from '../devfileApi';
import { fetchData } from './fetchData';

export type PreBuiltResources = Array<devfileApi.DevWorkspace | devfileApi.DevWorkspaceTemplate>;

export async function fetchResources(url: string): Promise<string> {
  try {
    return await fetchData<string>(url);
  } catch (e) {
    const errorMessage = `Failed to fetch pre-built resources from URL: ${url}. ${common.helpers.errors.getMessage(
      e,
    )}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}

export function loadResourcesContent(data: string): PreBuiltResources {
  if (!data) {
    throw new Error('Resources content is empty.');
  }

  try {
    return loadAll(data) as PreBuiltResources;
  } catch (e) {
    throw new Error(`Failed to parse resources content. ${common.helpers.errors.getMessage(e)}`);
  }
}
