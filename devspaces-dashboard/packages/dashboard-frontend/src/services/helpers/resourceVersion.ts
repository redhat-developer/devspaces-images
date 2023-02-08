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

export function getNewerResourceVersion(
  resourceVersionA: string | undefined,
  resourceVersionB: string,
): string {
  if (resourceVersionA === undefined) {
    return resourceVersionB;
  }

  return compareStringsAsNumbers(resourceVersionA, resourceVersionB) > 0
    ? resourceVersionA
    : resourceVersionB;
}

export function compareStringsAsNumbers(
  versionA: string | undefined,
  versionB: string | undefined,
): -1 | 0 | 1 {
  if (versionA === undefined || versionB === undefined) {
    return 0;
  }

  const aNum = parseInt(versionA, 10);
  const bNum = parseInt(versionB, 10);
  if (isNaN(aNum) || isNaN(bNum)) {
    return 0;
  }

  return aNum - bNum > 0 ? 1 : aNum - bNum < 0 ? -1 : 0;
}
