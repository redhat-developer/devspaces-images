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

import { Location } from 'history';
import { matchPath } from 'react-router-dom';

import { ROUTE, WorkspaceParams } from '@/Routes/routes';

export type LoaderMode =
  | { mode: 'factory' }
  | { mode: 'workspace'; workspaceParams: WorkspaceParams };

export function getLoaderMode(location: Location<unknown>): LoaderMode {
  const workspaceLoaderPath = matchPath<WorkspaceParams>(location.pathname, {
    path: ROUTE.IDE_LOADER,
    exact: true,
  });
  if (workspaceLoaderPath) {
    return { mode: 'workspace', workspaceParams: workspaceLoaderPath.params };
  } else {
    return { mode: 'factory' };
  }
}
