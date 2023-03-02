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

import { PROPAGATE_FACTORY_ATTRS, REMOTES_ATTR } from '../containers/Loader/const';
import SessionStorageService, { SessionStorageKey } from '../services/session-storage';
import { sanitizeLocation } from '../services/helpers/location';

(function acceptNewFactoryLink(): void {
  if (window.location.pathname.startsWith('/dashboard/')) {
    return;
  }

  storePathIfNeeded(window.location.pathname);

  const hash = window.location.hash.replace(/(\/?)#(\/?)/, '#');
  if (hash.startsWith('#http')) {
    let factoryUrl = hash.substring(1);
    if (!factoryUrl.includes('?')) {
      factoryUrl = factoryUrl.replace('&', '?');
    }
    window.location.href =
      window.location.origin + '/dashboard' + buildFactoryLoaderPath(factoryUrl);
  } else if (
    window.location.search.startsWith(`?${REMOTES_ATTR}=`) ||
    window.location.search.includes(`&${REMOTES_ATTR}=`)
  ) {
    // allow starting workspaces when no project url, but remotes are provided
    window.location.href =
      window.origin + '/dashboard' + buildFactoryLoaderPath(window.location.href, false);
  } else {
    window.location.href = window.location.origin + '/dashboard/';
  }
})();

export function storePathIfNeeded(path: string) {
  if (path !== '/') {
    SessionStorageService.update(SessionStorageKey.ORIGINAL_LOCATION_PATH, path);
  }
}

export function buildFactoryLoaderPath(url: string, appendUrl = true): string {
  const fullUrl = sanitizeLocation<URL>(new window.URL(url));

  const initParams = PROPAGATE_FACTORY_ATTRS.map(paramName => {
    const paramValue = extractUrlParam(fullUrl, paramName);
    return [paramName, paramValue];
  }).filter(([, paramValue]) => paramValue);

  const devfilePath = extractUrlParam(fullUrl, 'devfilePath') || extractUrlParam(fullUrl, 'df');
  if (devfilePath) {
    initParams.push(['override.devfileFilename', devfilePath]);
  }
  const newWorkspace = extractUrlParam(fullUrl, 'new');
  if (newWorkspace) {
    initParams.push(['policies.create', 'perclick']);
  }

  const searchParams = new URLSearchParams(initParams);

  if (appendUrl) {
    searchParams.append('url', fullUrl.toString());
  }

  return '/f?' + searchParams.toString();
}

function extractUrlParam(fullUrl: URL, paramName: string): string {
  const param = fullUrl.searchParams.get(paramName);
  let value = '';
  if (param) {
    value = param.slice();
  } else if (fullUrl.searchParams.has(paramName)) {
    value = 'true';
  }
  fullUrl.searchParams.delete(paramName);
  return value;
}
