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

import getRandomString from '@/services/helpers/random';

export const WORKSPACE_NAME_MAX_LENGTH = 63;

export function generateWorkspaceName(generateName: string): string {
  const suffix = generateSuffix();

  if (generateName.length + suffix.length > WORKSPACE_NAME_MAX_LENGTH) {
    generateName = generateName.substring(0, WORKSPACE_NAME_MAX_LENGTH - suffix.length - 1);
  }
  return generateName + suffix;
}

export function generateSuffix(): string {
  return '-' + getRandomString(4).toLowerCase();
}
