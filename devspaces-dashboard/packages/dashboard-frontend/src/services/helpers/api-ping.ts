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

import common, { helpers } from '@eclipse-che/common';
import axios from 'axios';

import { delay } from '@/services/helpers/delay';

const MAX_ATTEMPT_QUANTITY = 12;
const DELAY_TIME = 2500;

export async function isAvailableEndpoint(url: string | undefined): Promise<boolean> {
  if (!url) {
    return false;
  }

  let attempt = 0;
  let result = false;
  while (attempt < MAX_ATTEMPT_QUANTITY) {
    attempt++;
    try {
      await axios.get(url);
      result = true;
      break;
    } catch (error) {
      const is404 =
        common.helpers.errors.includesAxiosResponse(error) && error.response.status === 404;
      const is503 =
        common.helpers.errors.includesAxiosResponse(error) && error.response.status === 503;

      if (is404 === false && is503 === false) {
        result = true;
        break;
      }

      if (attempt === MAX_ATTEMPT_QUANTITY) {
        console.error(`Endpoint '${url}' is not available. ${helpers.errors.getMessage(error)}`);
        result = false;
        break;
      }

      await delay(DELAY_TIME);
    }
  }

  return result;
}
