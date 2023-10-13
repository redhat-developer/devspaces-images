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

import { dump } from 'js-yaml';

import devfileApi from '@/services/devfileApi';

const sortOrder: Array<keyof che.WorkspaceDevfile | keyof devfileApi.Devfile> = [
  'apiVersion',
  'schemaVersion',
  'metadata',
  'attributes',
  'projects',
  'components',
  'commands',
];

const lineWidth = 9999;

function sortKeys(key1: keyof che.WorkspaceDevfile, key2: keyof che.WorkspaceDevfile): -1 | 0 | 1 {
  const index1 = sortOrder.indexOf(key1);
  const index2 = sortOrder.indexOf(key2);
  if (index1 === -1 && index2 === -1) {
    return 0;
  }
  if (index1 === -1) {
    return 1;
  }
  if (index2 === -1) {
    return -1;
  }
  if (index1 < index2) {
    return -1;
  }
  if (index1 > index2) {
    return 1;
  }
  return 0;
}

/**
 * Provides a devfile stringify function.
 */
export default function stringify(
  obj: che.WorkspaceDevfile | devfileApi.Devfile | devfileApi.DevWorkspace,
): string {
  if (!obj) {
    return '';
  }
  return dump(obj, { lineWidth, sortKeys });
}
