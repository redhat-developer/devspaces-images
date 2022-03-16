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

export function mergeLogs(
  mapA: Map<string, string[]>,
  mapB: Map<string, string[]>,
): Map<string, string[]> {
  if (!mapA.size) {
    return mapB;
  }
  const res = new Map<string, string[]>();
  mapA.forEach((val: string[], key: string) => {
    const merge = (val: string[], newVal: string[] | undefined): string[] => {
      if (!newVal) {
        return val;
      }
      return val.concat(newVal);
    };
    res.set(key, merge(val, mapB.get(key)));
  });
  mapB.forEach((val: string[], key: string) => {
    if (!res.has(key)) {
      res.set(key, val);
    }
  });
  return res;
}

export function deleteLogs(map: Map<string, string[]>, key: string): Map<string, string[]> {
  const cloned = new Map<string, string[]>(map.entries());
  cloned.delete(key);
  return cloned;
}
