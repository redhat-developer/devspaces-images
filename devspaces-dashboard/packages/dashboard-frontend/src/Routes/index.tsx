/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
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

import { ROUTE } from '../route.enum';
import { buildFactoryLoaderLocation, sanitizeLocation } from '../services/helpers/location';

const CreateWorkspace = React.lazy(() => import('../pages/GetStarted'));
const WorkspacesListContainer = React.lazy(() => import('../containers/WorkspacesList'));
const WorkspaceDetailsContainer = React.lazy(() => import('../containers/WorkspaceDetails'));
const IdeLoaderContainer = React.lazy(() => import('../containers/IdeLoader'));
const FactoryLoaderContainer = React.lazy(() => import('../containers/FactoryLoader'));
const UserPreferences = React.lazy(() => import('../pages/UserPreferences'));
const UserAccount = React.lazy(() => import('../pages/UserAccount'));

export interface RouteItem {
  to: ROUTE;
  component: React.FunctionComponent<any>;
}

const items: RouteItem[] = [
  { to: ROUTE.GET_STARTED, component: CreateWorkspace },
  { to: ROUTE.HOME, component: CreateWorkspace },
  { to: ROUTE.WORKSPACES, component: WorkspacesListContainer },
  { to: ROUTE.WORKSPACE_DETAILS, component: WorkspaceDetailsContainer },
  { to: ROUTE.IDE_LOADER, component: IdeLoaderContainer },
  { to: ROUTE.LOAD_FACTORY, component: FactoryLoaderContainer },
  { to: ROUTE.USER_PREFERENCES, component: UserPreferences },
  { to: ROUTE.USER_ACCOUNT, component: UserAccount },
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
      <Redirect key="redirect-to-home" path="*" to="/" />
    </Switch>
  );
}

function redirectToFactoryLoader(props: RouteComponentProps): React.ReactElement {
  const location = props.location;
  if (location.pathname.startsWith('/')) {
    location.pathname = location.pathname.substring(1);
  }
  const newLocation = sanitizeLocation(location);
  const factoryUrl = newLocation.pathname + newLocation.search;
  const factoryLoaderLocation = buildFactoryLoaderLocation(factoryUrl);
  return <Redirect to={factoryLoaderLocation} />;
}

Routes.displayName = 'RoutesComponent';
export default Routes;
