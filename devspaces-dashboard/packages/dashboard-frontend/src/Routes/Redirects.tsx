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

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { buildFactoryLoaderPath } from '@/preload/main';
import { ROUTE } from '@/Routes';

/**
 * Redirects to the correct page based on the path.
 */
export function Redirects(): React.ReactElement {
  const location = useLocation();
  const { pathname, search } = location;

  if (
    pathname.startsWith('/http://') ||
    pathname.startsWith('/https://') ||
    pathname.startsWith('/ssh://') ||
    pathname.startsWith('/git@')
  ) {
    // get rid of the leading slash
    const locationPath = pathname.replace(/^\//, '') + search;

    const factoryLoaderPath = buildFactoryLoaderPath(locationPath).replace(
      /^\/f/,
      ROUTE.FACTORY_LOADER,
    );

    return <Navigate key="redirect-to-factory" to={factoryLoaderPath} />;
  }

  return <Navigate key="redirect-to-home" to={ROUTE.HOME} />;
}
