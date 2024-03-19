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

import { History, Location } from 'history';

import { ROUTE } from '@/Routes/routes';
import { LoaderTab, WorkspaceDetailsTab } from '@/services/helpers/types';
import { UserPreferencesTab } from '@/services/helpers/types';
import { Workspace } from '@/services/workspace-adapter';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

export function buildHomeLocation(): Location {
  return _buildLocationObject(ROUTE.HOME);
}

export function buildIdeLoaderLocation(workspace: Workspace, tab?: LoaderTab): Location {
  let pathAndQuery: string;
  if (!tab) {
    pathAndQuery = ROUTE.IDE_LOADER.replace(':namespace', workspace.namespace).replace(
      ':workspaceName',
      workspace.name,
    );
  } else {
    const tabId = LoaderTab[tab];
    pathAndQuery = ROUTE.IDE_LOADER_TAB.replace(':namespace', workspace.namespace)
      .replace(':workspaceName', workspace.name)
      .replace(':tabId', tabId);
  }
  return _buildLocationObject(pathAndQuery);
}

export function buildWorkspacesLocation(): Location {
  return _buildLocationObject(ROUTE.WORKSPACES);
}

export function buildUserPreferencesLocation(tab?: UserPreferencesTab): Location {
  let pathAndQuery: string;
  if (!tab) {
    pathAndQuery = ROUTE.USER_PREFERENCES;
  } else {
    pathAndQuery = ROUTE.USER_PREFERENCES_TAB.replace(':tabId', tab);
  }
  return _buildLocationObject(pathAndQuery);
}

export function buildGettingStartedLocation(): Location {
  return _buildLocationObject(ROUTE.GET_STARTED);
}

export function buildDetailsLocation(
  ...args:
    | [namespace: string, workspaceName: string, pageTab?: WorkspaceDetailsTab]
    | [workspace: Workspace, pageTab?: WorkspaceDetailsTab]
): Location {
  let workspaceName: string;
  let namespace: string;
  let tab: WorkspaceDetailsTab | undefined;
  if (typeof args[0] === 'string') {
    namespace = args[0];
    workspaceName = args[1] as string;
    tab = args[2];
  } else {
    const workspace = args[0];
    namespace = workspace.namespace;
    workspaceName = workspace.name;
    tab = args[1] as WorkspaceDetailsTab | undefined;
  }

  let pathAndQuery: string;
  if (!tab) {
    pathAndQuery = ROUTE.WORKSPACE_DETAILS.replace(':namespace', namespace).replace(
      ':workspaceName',
      workspaceName,
    );
  } else {
    pathAndQuery = ROUTE.WORKSPACE_DETAILS_TAB.replace(':namespace', namespace)
      .replace(':workspaceName', workspaceName)
      .replace(':tabId', tab);
  }
  return _buildLocationObject(pathAndQuery);
}

export function buildFactoryLocation(): Location {
  return _buildLocationObject(ROUTE.FACTORY_LOADER);
}

function _buildLocationObject(pathAndQuery: string): Location {
  const tmpUrl = new URL(pathAndQuery, window.location.origin);
  return {
    pathname: tmpUrl.pathname,
    search: tmpUrl.search,
    hash: tmpUrl.hash,
    state: undefined,
  };
}

export function toHref(history: History, location: Location): string {
  return history.createHref(location);
}
