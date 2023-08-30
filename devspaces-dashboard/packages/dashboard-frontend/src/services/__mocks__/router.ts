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

import { createLocation, createMemoryHistory } from 'history';
import { match as routerMatch, RouteComponentProps } from 'react-router';

const generateUrl = <Params>(path: string, params: Params): string => {
  let resultPath = path;
  for (const param in params) {
    if (params[param]) {
      resultPath = resultPath.replace(`:${param}`, `${params[param]}`);
    } else {
      resultPath = resultPath.replace(`:${param}`, '');
    }
  }
  return resultPath;
};

export function getMockRouterProps<
  Params extends { [K in keyof Params]?: string } = Record<string, string>,
>(path: string, params: Params): RouteComponentProps<Params> {
  const isExact = false;
  const url = generateUrl(path, params);

  const match: routerMatch<Params> = { isExact, path, url, params };
  const history = createMemoryHistory();
  const location = createLocation(match.url);
  history.location = location;

  return {
    history,
    location,
    match,
  };
}
