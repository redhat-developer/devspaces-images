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

export function isDevfileMetaData(
  devfileMetaData: unknown,
): devfileMetaData is che.DevfileMetaData {
  return (
    typeof devfileMetaData === 'object' &&
    (devfileMetaData as che.DevfileMetaData).displayName !== undefined &&
    (devfileMetaData as che.DevfileMetaData).icon !== undefined &&
    (devfileMetaData as che.DevfileMetaData).links !== undefined &&
    (devfileMetaData as che.DevfileMetaData).tags !== undefined
  );
}
