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
import { helpers } from '@eclipse-che/common';
import { prefix } from './const';
import * as yaml from 'js-yaml';
import { FactoryResolver } from '../helpers/types';

export async function getYamlResolver(
  namespace: string,
  location: string,
): Promise<FactoryResolver> {
  try {
    const url = new URL(location);
    const response =
      url.origin === window.location.origin
        ? await axios.get(url.href)
        : await axios.post(`${prefix}/namespace/${namespace}/yaml/resolver`, { url: url.href });

    return {
      v: 'yaml-resolver',
      devfile: yaml.load(response.data),
      location: url.href,
      links: [],
    };
  } catch (e) {
    throw new Error(`Failed to fetch yaml resolver'. ${helpers.errors.getMessage(e)}`);
  }
}
