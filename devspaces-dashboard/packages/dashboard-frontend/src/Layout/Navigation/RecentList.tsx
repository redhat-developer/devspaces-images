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
import { NavGroup, NavList } from '@patternfly/react-core';

import NavigationRecentItem from './RecentItem';
import { NavigationRecentItemObject } from '.';
import { ROUTE } from '../../Routes/routes';
import { Workspace } from '../../services/workspace-adapter';
import { History } from 'history';

function buildRecentWorkspacesItems(
  workspaces: Array<Workspace>,
  activePath: string,
  history: History,
): Array<React.ReactElement> {
  return workspaces.map(workspace => {
    const workspaceName = workspace.name;
    const namespace = workspace.namespace;
    const navigateTo = ROUTE.IDE_LOADER.replace(':namespace', namespace).replace(
      ':workspaceName',
      workspaceName,
    );
    const item: NavigationRecentItemObject = {
      to: navigateTo,
      label: workspaceName,
      status: workspace.status,
      workspaceUID: workspace.uid,
      isDevWorkspace: workspace.isDevWorkspace,
    };
    return (
      <NavigationRecentItem key={item.to} item={item} activePath={activePath} history={history} />
    );
  });
}

function NavigationRecentList(props: {
  workspaces: Array<Workspace>;
  activePath: string;
  history: History;
}): React.ReactElement {
  const recentWorkspaceItems = buildRecentWorkspacesItems(
    props.workspaces,
    props.activePath,
    props.history,
  );
  return (
    <NavList>
      <NavGroup title="RECENT WORKSPACES" style={{ marginTop: '25px' }}>
        {recentWorkspaceItems}
      </NavGroup>
    </NavList>
  );
}
NavigationRecentList.displayName = 'NavigationRecentListComponent';
export default NavigationRecentList;
