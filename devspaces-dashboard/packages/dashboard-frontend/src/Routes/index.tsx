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

import React from 'react';
import { Redirect, Route, RouteComponentProps, Switch } from 'react-router';

import WorkspaceDetailsContainer from '@/containers/WorkspaceDetails';
import WorkspacesListContainer from '@/containers/WorkspacesList';
import CreateWorkspace from '@/pages/GetStarted';
import UserPreferences from '@/pages/UserPreferences';
import { buildFactoryLoaderPath } from '@/preload/main';
import { ROUTE } from '@/Routes/routes';

const LoaderContainer = React.lazy(() => import('../containers/Loader'));
// temporary hidden, https://github.com/eclipse/che/issues/21595
// const UserAccount = React.lazy(() => import('../pages/UserAccount'));

export interface RouteItem {
  to: ROUTE;
  component: React.FunctionComponent<any>;
}

const items: RouteItem[] = [
  { to: ROUTE.GET_STARTED, component: CreateWorkspace },
  { to: ROUTE.HOME, component: CreateWorkspace },
  { to: ROUTE.WORKSPACES, component: WorkspacesListContainer },
  { to: ROUTE.WORKSPACE_DETAILS, component: WorkspaceDetailsContainer },
  { to: ROUTE.IDE_LOADER, component: LoaderContainer },
  { to: ROUTE.FACTORY_LOADER, component: LoaderContainer },
  { to: ROUTE.USER_PREFERENCES, component: UserPreferences },
  // temporary hidden, https://github.com/eclipse/che/issues/21595
  // { to: ROUTE.USER_ACCOUNT, component: UserAccount },
];

function Routes(): React.ReactElement {
  const routes = items.map(item => (
    <Route exact key={item.to} path={item.to} component={item.component} />
  ));
  return (
    <Switch>
      <Route key="simple-factory-location-1" path="/http*" render={redirectToFactoryLoader} />
      <Route key="simple-factory-location-2" path="/git@*" render={redirectToFactoryLoader} />
      {...routes}
      <Redirect key="redirect-to-home" path="*" to={ROUTE.HOME} />
    </Switch>
  );
}

function redirectToFactoryLoader(props: RouteComponentProps): React.ReactElement {
  const { pathname, search } = props.location;
  const location = pathname.substring(1) + search;
  const factoryLoaderPath = buildFactoryLoaderPath(location).replace(/^\/f/, ROUTE.FACTORY_LOADER);
  return <Redirect key="redirect-to-factory" to={factoryLoaderPath} />;
}

Routes.displayName = 'RoutesComponent';
export default Routes;
