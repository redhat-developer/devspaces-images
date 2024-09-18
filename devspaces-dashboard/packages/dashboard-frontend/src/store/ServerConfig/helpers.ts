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

export function isSourceAllowed(allowedSourceUrls: string[] | undefined, url: string): boolean {
  if (allowedSourceUrls === undefined || allowedSourceUrls.length === 0) {
    return true;
  }

  for (const allowedSourceUrl of allowedSourceUrls) {
    if (allowedSourceUrl.includes('*')) {
      let pattern = allowedSourceUrl.trim();
      if (!pattern.startsWith('*')) {
        pattern = `^${pattern}`;
      }
      if (!pattern.endsWith('*')) {
        pattern = `${pattern}$`;
      }
      pattern = pattern.replace(/\*/g, '.*');
      const regex = new RegExp(pattern);
      if (regex.test(url)) {
        return true;
      }
    } else {
      if (allowedSourceUrl.trim() === url) {
        return true;
      }
    }
  }

  return false;
}
