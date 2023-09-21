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

import { api } from '@eclipse-che/common';
import axios from 'axios';
import { dashboardBackendPrefix } from './const';

export async function fetchGitConfig(namespace: string): Promise<api.IGitConfig> {
  const response = await axios.get(`${dashboardBackendPrefix}/namespace/${namespace}/gitconfig`);
  return response.data;
}

export async function patchGitConfig(
  namespace: string,
  gitconfig: api.IGitConfig,
): Promise<api.IGitConfig> {
  const response = await axios.patch(
    `${dashboardBackendPrefix}/namespace/${namespace}/gitconfig`,
    gitconfig,
  );
  return response.data;
}
