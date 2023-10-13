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

import { helpers } from '@eclipse-che/common';
import axios from 'axios';
import * as yaml from 'js-yaml';

import { dashboardBackendPrefix } from '@/services/backend-client/const';
import devfileApi from '@/services/devfileApi';
import { FactoryResolver } from '@/services/helpers/types';

export async function getYamlResolver(
  namespace: string,
  location: string,
): Promise<FactoryResolver> {
  try {
    const url = new URL(location);
    const response =
      url.origin === window.location.origin
        ? await axios.get(url.href)
        : await axios.post(`${dashboardBackendPrefix}/namespace/${namespace}/yaml/resolver`, {
            url: url.href,
          });

    return {
      v: 'yaml-resolver',
      devfile: yaml.load(response.data) as devfileApi.Devfile,
      location: url.href,
      links: [],
    };
  } catch (e) {
    throw new Error(`Failed to fetch yaml resolver'. ${helpers.errors.getMessage(e)}`);
  }
}
