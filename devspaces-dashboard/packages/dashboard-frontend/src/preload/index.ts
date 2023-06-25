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

import { FactoryLocation, FactoryLocationAdapter } from '../services/factory-location-adapter';
import {
  PROPAGATE_FACTORY_ATTRS,
  REMOTES_ATTR,
} from '../services/helpers/factoryFlow/buildFactoryParams';
import { sanitizeLocation } from '../services/helpers/location';
import SessionStorageService, { SessionStorageKey } from '../services/session-storage';

(function acceptNewFactoryLink(): void {
  if (window.location.pathname.startsWith('/dashboard/')) {
    return;
  }

  storePathIfNeeded(window.location.pathname);

  const hash = window.location.hash.replace(/(\/?)#(\/?)/, '');
  if (FactoryLocationAdapter.isFullPathUrl(hash) || FactoryLocationAdapter.isSshLocation(hash)) {
    window.location.href = window.location.origin + '/dashboard' + buildFactoryLoaderPath(hash);
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

export function buildFactoryLoaderPath(location: string, appendUrl = true): string {
  let factory: FactoryLocation | URL;
  if (appendUrl) {
    try {
      factory = new FactoryLocationAdapter(location);
    } catch (e) {
      console.error(e);
      return '/';
    }
  } else {
    factory = sanitizeLocation<URL>(new window.URL(location));
  }

  const initParams = PROPAGATE_FACTORY_ATTRS.map(paramName => {
    const paramValue = extractUrlParam(factory.searchParams, paramName);
    return [paramName, paramValue];
  }).filter(([, paramValue]) => paramValue);

  const devfilePath =
    extractUrlParam(factory.searchParams, 'devfilePath') ||
    extractUrlParam(factory.searchParams, 'df');
  if (devfilePath) {
    initParams.push(['override.devfileFilename', devfilePath]);
  }
  const newWorkspace = extractUrlParam(factory.searchParams, 'new');
  if (newWorkspace) {
    initParams.push(['policies.create', 'perclick']);
  }

  const searchParams = new URLSearchParams(initParams);

  if (appendUrl) {
    searchParams.append('url', factory.toString());
  }

  return '/f?' + searchParams.toString();
}

function extractUrlParam(params: URLSearchParams, paramName: string): string {
  const param = params.get(paramName);
  let value = '';
  if (param) {
    value = param.slice();
  } else if (params.has(paramName)) {
    value = 'true';
  }
  params.delete(paramName);
  return value;
}
