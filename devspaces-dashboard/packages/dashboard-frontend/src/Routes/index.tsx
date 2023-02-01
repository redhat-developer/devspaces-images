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
import { buildFactoryLoaderPath } from '../preload';
import { ROUTE } from './routes';

const CreateWorkspace = React.lazy(() => import('../pages/GetStarted'));
const WorkspacesListContainer = React.lazy(() => import('../containers/WorkspacesList'));
const WorkspaceDetailsContainer = React.lazy(() => import('../containers/WorkspaceDetails'));
const LoaderContainer = React.lazy(() => import('../containers/Loader'));
const UserPreferences = React.lazy(() => import('../pages/UserPreferences'));
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
      <Route key="simple-factory-url-1" path="/http:\/\/*" render={redirectToFactoryLoader} />
      <Route key="simple-factory-url-2" path="/https:\/\/*" render={redirectToFactoryLoader} />
      {...routes}
      <Redirect key="redirect-to-home" path="*" to={ROUTE.HOME} />
    </Switch>
  );
}

function redirectToFactoryLoader(props: RouteComponentProps): React.ReactElement {
  const { pathname, search } = props.location;
  let factoryUrl = pathname.substring(1) + search;
  if (!factoryUrl.includes('?')) {
    factoryUrl = factoryUrl.replace('&', '?');
  }
  const factoryLoaderPath = buildFactoryLoaderPath(factoryUrl).replace(
    /^\/f/,
    ROUTE.FACTORY_LOADER,
  );
  return <Redirect key="redirect-to-factory" to={factoryLoaderPath} />;
}

Routes.displayName = 'RoutesComponent';
export default Routes;
