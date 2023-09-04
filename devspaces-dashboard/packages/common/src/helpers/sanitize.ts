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

const oauthParams = ['state', 'session', 'session_state', 'code'];

/**
 * Remove oauth params.
 */
export function sanitizeLocation<
  T extends { search: string; pathname: string } = Location,
>(location: T, removeParams: string[] = []): T {
  const sanitizedSearchParams = sanitizeSearchParams(
    new URLSearchParams(location.search),
    removeParams,
  );
  const sanitizedPathname = sanitizePathname(location.pathname, removeParams);

  return {
    ...location,
    search: sanitizedSearchParams.toString(),
    searchParams: sanitizedSearchParams,
    pathname: sanitizedPathname,
  };
}

export function sanitizeSearchParams(
  searchParams: URLSearchParams,
  removeParams: string[] = [],
): URLSearchParams {
  const toRemove = [...oauthParams, ...removeParams];

  // remove oauth params
  toRemove.forEach(val => searchParams.delete(val));

  // sanitize each query param
  const sanitizedSearchParams = new URLSearchParams();
  searchParams.forEach((value, param) => {
    if (!value) {
      sanitizedSearchParams.set(param, value);
      return;
    }

    const sanitizedValue = sanitizeStr(value, toRemove);
    sanitizedSearchParams.set(param, sanitizedValue);
  });

  return sanitizedSearchParams;
}

export function sanitizePathname(
  pathname: string,
  removeParams: string[] = [],
): string {
  const toRemove = [...oauthParams, ...removeParams];

  // sanitize pathname
  const sanitizedPathname = sanitizeStr(pathname, toRemove);

  return sanitizedPathname;
}

function sanitizeStr(str: string, removeParams: string[] = []): string {
  removeParams.forEach(param => {
    const re = new RegExp('&' + param + '=.+?(?=(?:[?&/#]|$))', 'i');
    str = str.replace(re, '');
  });

  return str;
}
