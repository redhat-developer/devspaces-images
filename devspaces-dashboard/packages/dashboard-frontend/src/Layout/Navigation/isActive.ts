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

import { ROUTE } from '@/Routes/routes';

export default function isActive(itemPath: string, activePath: string | undefined): boolean {
  if (itemPath === activePath) {
    return true;
  } else if (activePath && itemPath === ROUTE.WORKSPACES) {
    return /\/workspace\//.test(activePath);
  }
  return false;
}
