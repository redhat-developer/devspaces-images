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

export enum ROUTE {
  HOME = '/',
  GET_STARTED = '/create-workspace',
  GET_STARTED_TAB = '/create-workspace?tab=:tabId',
  WORKSPACES = '/workspaces',
  WORKSPACE_DETAILS = '/workspace/:namespace/:workspaceName',
  WORKSPACE_DETAILS_TAB = '/workspace/:namespace/:workspaceName?tab=:tabId',
  IDE_LOADER = '/ide/:namespace/:workspaceName',
  IDE_LOADER_TAB = '/ide/:namespace/:workspaceName?tab=:tabId',
  FACTORY_LOADER = '/load-factory',
  FACTORY_LOADER_URL = '/load-factory?url=:url',
  USER_PREFERENCES = '/user-preferences',
  USER_ACCOUNT = '/user-account',
}

export type WorkspaceParams = {
  namespace: string;
  workspaceName: string;
};
