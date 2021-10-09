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

import { History, Location } from 'history';
import { ROUTE } from '../../route.enum';
import { CreateWorkspaceTab, IdeLoaderTab, WorkspaceDetailsTab } from './types';
import { Workspace } from '../workspace-adapter';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

export function buildIdeLoaderLocation(workspace: Workspace, tab?: IdeLoaderTab): Location {
  let pathAndQuery: string;
  if (!tab) {
    pathAndQuery = ROUTE.IDE_LOADER
      .replace(':namespace', workspace.namespace)
      .replace(':workspaceName', workspace.name);
  } else {
    const tabId = IdeLoaderTab[tab];
    pathAndQuery = ROUTE.IDE_LOADER_TAB
      .replace(':namespace', workspace.namespace)
      .replace(':workspaceName', workspace.name)
      .replace(':tabId', tabId);
  }
  return _buildLocationObject(pathAndQuery);
}

export function buildFactoryLoaderLocation(url?: string): Location {
  let pathAndQuery: string;
  if (!url) {
    pathAndQuery = ROUTE.LOAD_FACTORY;
  } else {
    // try to extract some parameters before doing the relocation
    const fullUrl = new window.URL(url.toString());

    // search for an editor switch and if there is one, remove it from the URL
    const editorParam = fullUrl.searchParams.get('che-editor');
    let editor;
    if (editorParam && typeof(editorParam) === 'string') {
        editor = editorParam.slice();
    }
    fullUrl.searchParams.delete('che-editor');
    const encodedUrl = encodeURIComponent(fullUrl.toString());

    // if editor specified, add it as a new parameter
    pathAndQuery = ROUTE.LOAD_FACTORY_URL.replace(':url', encodedUrl);
    if (editor) {
      pathAndQuery = `${pathAndQuery}&che-editor=${editor}`;
    }
  }
  return _buildLocationObject(pathAndQuery);
}

export function buildWorkspacesLocation(): Location {
  return _buildLocationObject(ROUTE.WORKSPACES);
}

export function buildGettingStartedLocation(tab?: CreateWorkspaceTab): Location {
  let pathAndQuery: string;
  if (!tab) {
    pathAndQuery = ROUTE.GET_STARTED;
  } else {
    pathAndQuery = ROUTE.GET_STARTED_TAB
      .replace(':tabId', tab);
  }
  return _buildLocationObject(pathAndQuery);
}

export function buildDetailsLocation(workspace: Workspace, tab?: WorkspaceDetailsTab): Location {
  let pathAndQuery: string;
  if (!tab) {
    pathAndQuery = ROUTE.WORKSPACE_DETAILS
      .replace(':namespace', workspace.namespace)
      .replace(':workspaceName', workspace.name);
  } else {
    pathAndQuery = ROUTE.WORKSPACE_DETAILS_TAB
      .replace(':namespace', workspace.namespace)
      .replace(':workspaceName', workspace.name)
      .replace(':tabId', tab);
  }
  return _buildLocationObject(pathAndQuery);
}

function _buildLocationObject(pathAndQuery: string): Location {
  const tmpUrl = new URL(pathAndQuery, window.location.origin);
  return {
    pathname: tmpUrl.pathname,
    search: tmpUrl.search,
    hash: tmpUrl.hash,
    state: undefined
  };
}

export function toHref(history: History, location: Location): string {
  return history.createHref(location);
}

const oauthParams = ['state', 'session_state', 'code'];
/**
 * Removes oauth params.
 */
export function sanitizeLocation(location: Location, removeParams: string[] = []): Location {
  const toRemove = [...oauthParams, ...removeParams];
  // clear search params
  if (location.search) {
    const searchParams = new window.URLSearchParams(location.search);
    toRemove.forEach(param => searchParams.delete(param));
    location.search = '?' + searchParams.toString();
  }

  // clear pathname
  toRemove.forEach(param => {
    const re = new RegExp('&' + param + '=[^&]+', 'i');
    const newPathname = location.pathname.replace(re, '');
    location.pathname = newPathname;
  });

  return location;
}
