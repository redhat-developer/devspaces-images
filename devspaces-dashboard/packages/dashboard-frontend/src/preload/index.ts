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

import SessionStorageService, { SessionStorageKey } from '../services/session-storage';

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
  } else {
    window.location.href = window.location.origin + '/dashboard/';
  }
})();

export function storePathIfNeeded(path: string) {
  if (path !== '/') {
    SessionStorageService.update(SessionStorageKey.ORIGINAL_LOCATION_PATH, path);
  }
}

export function buildFactoryLoaderPath(url: string): string {
  const fullUrl = new window.URL(url);
  const editor = extractUrlParam(fullUrl, 'che-editor');
  let devfilePath = extractUrlParam(fullUrl, 'devfilePath');
  if (!devfilePath) {
    devfilePath = extractUrlParam(fullUrl, 'df');
  }
  const devWorkspace = extractUrlParam(fullUrl, 'devWorkspace');
  const newWorkspace = extractUrlParam(fullUrl, 'new');
  const encodedUrl = encodeURIComponent(fullUrl.toString());

  let newPath = '/f?url=' + encodedUrl;
  if (editor) {
    newPath = `${newPath}&che-editor=${editor}`;
  }
  if (devfilePath) {
    newPath = `${newPath}&override.devfileFilename=${devfilePath}`;
  }
  if (newWorkspace) {
    newPath = `${newPath}&policies.create=perclick`;
  }
  if (devWorkspace) {
    newPath = `${newPath}&devWorkspace=${encodeURIComponent(devWorkspace)}`;
  }
  return newPath;
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
