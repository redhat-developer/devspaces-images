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

import getRandomString from '@/services/helpers/random';

export function generateWorkspaceName(generateName: string): string {
  return generateName + generateSuffix();
}

export function generateSuffix(): string {
  return '-' + getRandomString(4).toLowerCase();
}
