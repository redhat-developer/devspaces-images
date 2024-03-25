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
import * as yaml from 'js-yaml';

import devfileApi from '@/services/devfileApi';
import { FactoryResolver } from '@/services/helpers/types';
import { fetchData } from '@/services/registry/fetchData';

export async function getYamlResolver(location: string): Promise<FactoryResolver> {
  try {
    const data = await fetchData<string>(location);

    return {
      v: 'yaml-resolver',
      devfile: yaml.load(data) as devfileApi.Devfile,
      location,
      links: [],
    };
  } catch (e) {
    throw new Error(`Failed to resolve yaml. ${helpers.errors.getMessage(e)}`);
  }
}
