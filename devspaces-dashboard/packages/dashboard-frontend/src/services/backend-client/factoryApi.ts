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

import { cheServerPrefix } from '@/services/backend-client/const';
import { FactoryResolver } from '@/services/helpers/types';

export async function getFactoryResolver(
  url: string,
  overrideParams: { [params: string]: string } = {},
): Promise<FactoryResolver> {
  if (url.indexOf(' ') !== -1) {
    url = encodeURI(url);
  }
  const response = await axios.post(
    `${cheServerPrefix}/factory/resolver`,
    Object.assign({}, overrideParams, { url }),
  );

  return response.data;
}

export async function refreshFactoryOauthToken(url: string): Promise<void> {
  await axios.post(`${cheServerPrefix}/factory/token/refresh?url=${url}`);

  return Promise.resolve();
}
