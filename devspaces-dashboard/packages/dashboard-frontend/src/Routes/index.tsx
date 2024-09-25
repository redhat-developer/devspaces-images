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
import { Params, Route, Routes } from 'react-router-dom';

import GetStartedContainer from '@/containers/GetStarted';
import UserPreferencesContainer from '@/containers/UserPreferences';
import WorkspaceDetailsContainer from '@/containers/WorkspaceDetails';
import WorkspacesListContainer from '@/containers/WorkspacesList';
import { Redirects } from '@/Routes/Redirects';

export enum ROUTE {
  HOME = '/',
  GET_STARTED = '/create-workspace',
  WORKSPACES = '/workspaces',
  WORKSPACE_DETAILS = '/workspace/:namespace/:workspaceName',
  WORKSPACE_DETAILS_TAB = '/workspace/:namespace/:workspaceName?tab=:tabId',
  IDE_LOADER = '/ide/:namespace/:workspaceName',
  IDE_LOADER_TAB = '/ide/:namespace/:workspaceName?tab=:tabId',
  FACTORY_LOADER = '/load-factory',
  FACTORY_LOADER_URL = '/load-factory?url=:url',
  USER_PREFERENCES = '/user-preferences',
  USER_PREFERENCES_TAB = '/user-preferences?tab=:tabId',
  USER_ACCOUNT = '/user-account',
}

export type WorkspaceRouteParams = Params<'namespace' | 'workspaceName'>;

const LoaderContainer = React.lazy(() => import('../containers/Loader'));
// temporary hidden, https://github.com/eclipse/che/issues/21595
// const UserAccount = React.lazy(() => import('../pages/UserAccount'));

export function AppRoutes(): React.ReactElement {
  return (
    <Routes>
      <Route key="get-started" path={ROUTE.GET_STARTED} element={<GetStartedContainer />} />
      <Route key="home" path={ROUTE.HOME} element={<GetStartedContainer />} />
      <Route key="workspaces-list" path={ROUTE.WORKSPACES} element={<WorkspacesListContainer />} />
      <Route
        key="workspace-details"
        path={ROUTE.WORKSPACE_DETAILS}
        element={<WorkspaceDetailsContainer />}
      />
      <Route key="ide-loader" path={ROUTE.IDE_LOADER} element={<LoaderContainer />} />
      <Route key="factory-loader" path={ROUTE.FACTORY_LOADER} element={<LoaderContainer />} />
      <Route
        key="user-preferences"
        path={ROUTE.USER_PREFERENCES}
        element={<UserPreferencesContainer />}
      />

      {/* temporary hidden, https://github.com/eclipse/che/issues/21595
      <Route key="user-account" path={ROUTE.USER_ACCOUNT} element={<UserAccount />} /> */}

      <Route key="redirects" path="*" element={<Redirects />} />
    </Routes>
  );
}
