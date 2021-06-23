/*
 * Copyright (c) 2018-2020 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { AxiosResponse } from 'axios';

export function getErrorMessage(error: Error | AxiosResponse): string {
  if (!error) {
    return '';
  }
  if (isError(error) && error.message) {
    return error.message;
  }
  if (isAxiosResponse(error)) {
    if (error.data.message && typeof error.data.message === 'string') {
      return error.data.message;
    } else {
      return JSON.stringify(error.data);
    }
  }
  return JSON.stringify(error);
}

function isError(error: Error | any): error is Error {
  return error.message !== undefined;
}

function isAxiosResponse(response: AxiosResponse | any): response is AxiosResponse {
  return response.status !== undefined && response.data !== undefined;
}
