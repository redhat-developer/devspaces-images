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

import { createSelector } from 'reselect';
import { AppState } from '..';
import { constructWorkspace, Workspace } from '../../services/workspace-adapter';
import { selectRunningDevWorkspaces, selectDevWorkspacesError } from './devWorkspaces/selectors';

const selectState = (state: AppState) => state.workspaces;
const selectDevWorkspacesState = (state: AppState) => state.devWorkspaces;

export const selectIsLoading = createSelector(selectDevWorkspacesState, devWorkspacesState => {
  return devWorkspacesState.isLoading;
});

export const selectAllWorkspaces = createSelector(selectDevWorkspacesState, devWorkspacesState => {
  return devWorkspacesState.workspaces.map(workspace => constructWorkspace(workspace));
});

export const selectWorkspaceByQualifiedName = createSelector(
  selectState,
  selectAllWorkspaces,
  (state, allWorkspaces) => {
    return allWorkspaces.find(
      workspace =>
        workspace.infrastructureNamespace === state.namespace &&
        workspace.name === state.workspaceName,
    );
  },
);

export const selectWorkspaceByUID = createSelector(
  selectState,
  selectAllWorkspaces,
  (state, allWorkspaces) => {
    return allWorkspaces.find(workspace => workspace.uid === state.workspaceUID);
  },
);

export const selectAllWorkspacesByName = createSelector(selectAllWorkspaces, allWorkspaces => {
  if (!allWorkspaces) {
    return null;
  }
  return allWorkspaces.sort(sortByNamespaceNameFn);
});
const sortByNamespaceNameFn = (workspaceA: Workspace, workspaceB: Workspace): -1 | 0 | 1 => {
  return sortByNamespaceFn(workspaceA, workspaceB) || sortByNameFn(workspaceA, workspaceB);
};
const sortByNamespaceFn = (workspaceA: Workspace, workspaceB: Workspace): -1 | 0 | 1 => {
  if (workspaceA.namespace > workspaceB.namespace) {
    return 1;
  } else if (workspaceA.namespace < workspaceB.namespace) {
    return -1;
  } else {
    return 0;
  }
};
const sortByNameFn = (workspaceA: Workspace, workspaceB: Workspace): -1 | 0 | 1 => {
  if (workspaceA.name > workspaceB.name) {
    return 1;
  } else if (workspaceA.name < workspaceB.name) {
    return -1;
  } else {
    return 0;
  }
};

const sortByUpdatedTimeFn = (workspaceA: Workspace, workspaceB: Workspace): -1 | 0 | 1 => {
  const timeA = workspaceA.updated;
  const timeB = workspaceB.updated;
  if (timeA > timeB) {
    return -1;
  } else if (timeA < timeB) {
    return 1;
  } else {
    return 0;
  }
};

const selectRecentNumber = createSelector(selectState, state => state.recentNumber);
export const selectRecentWorkspaces = createSelector(
  selectRecentNumber,
  selectAllWorkspaces,
  (recentNumber, allWorkspaces) => allWorkspaces.sort(sortByUpdatedTimeFn).slice(0, recentNumber),
);

export const selectWorkspacesError = createSelector(
  selectDevWorkspacesError,
  devWorkspacesError => devWorkspacesError,
);

export const selectRunningWorkspaces = createSelector(
  selectRunningDevWorkspaces,
  runningDevWorkspaces => {
    return runningDevWorkspaces.map(constructWorkspace);
  },
);
