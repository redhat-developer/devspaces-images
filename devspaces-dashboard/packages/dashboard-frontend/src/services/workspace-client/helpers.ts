/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
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

/**
 * Checks for HTTP 401 Unauthorized response status code
 */
export function isUnauthorized(response: unknown): boolean {
  return hasStatus(response, 401);
}

/**
 * Checks for HTTP 403 Forbidden
 */
export function isForbidden(response: unknown): boolean {
  return hasStatus(response, 403);
}

/**
 * Checks for HTTP 500 Internal Server Error
 */
export function isInternalServerError(response: unknown): boolean {
  return hasStatus(response, 500);
}

function hasStatus(response: unknown, _status: number): boolean {
  if (typeof response === 'string') {
    if (response.toLowerCase().includes(`http status ${_status}`)) {
      return true;
    }
  } else if (common.helpers.errors.isError(response)) {
    const str = response.message.toLowerCase();
    if (str.includes(`status code ${_status}`)) {
      return true;
    }
  } else if (typeof response === 'object' && response !== null) {
    const { status, statusCode } = response as { [propName: string]: string | number };
    if (statusCode == _status) {
      return true;
    } else if (status == _status) {
      return true;
    } else {
      try {
        const str = JSON.stringify(response).toLowerCase();
        if (str.includes(`http status ${_status}`)) {
          return true;
        } else if (str.includes(`status code ${_status}`)) {
          return true;
        }
      } catch (e) {
        // no-op
      }
    }
  }
  return false;
}
