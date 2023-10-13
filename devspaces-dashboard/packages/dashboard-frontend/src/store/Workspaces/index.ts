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

import { Reducer } from 'redux';

import devfileApi from '@/services/devfileApi';
import { FactoryParams } from '@/services/helpers/factoryFlow/buildFactoryParams';
import { Workspace } from '@/services/workspace-adapter';
import { createObject } from '@/store/helpers';
import * as DevWorkspacesStore from '@/store/Workspaces/devWorkspaces';

import { AppThunk } from '..';

// This state defines the type of data maintained in the Redux store.
export interface State {
  isLoading: boolean;

  // current workspace qualified name
  namespace: string;
  workspaceName: string;
  workspaceUID: string;
  // number of recent workspaces
  recentNumber: number;
}

interface RequestWorkspacesAction {
  type: 'REQUEST_WORKSPACES';
}

interface ReceiveErrorAction {
  type: 'RECEIVE_ERROR';
}

interface ReceiveWorkspacesAction {
  type: 'RECEIVE_WORKSPACES';
}

interface UpdateWorkspaceAction {
  type: 'UPDATE_WORKSPACE';
}

interface DeleteWorkspaceLogsAction {
  type: 'DELETE_WORKSPACE_LOGS';
  workspace: Workspace;
}

interface DeleteWorkspaceAction {
  type: 'DELETE_WORKSPACE';
}

interface AddWorkspaceAction {
  type: 'ADD_WORKSPACE';
}

interface SetWorkspaceQualifiedName {
  type: 'SET_WORKSPACE_NAME';
  namespace: string;
  workspaceName: string;
}

interface ClearWorkspaceQualifiedName {
  type: 'CLEAR_WORKSPACE_NAME';
}

interface SetWorkspaceUID {
  type: 'SET_WORKSPACE_UID';
  workspaceUID: string;
}

interface ClearWorkspaceUID {
  type: 'CLEAR_WORKSPACE_UID';
}

type KnownAction =
  | RequestWorkspacesAction
  | ReceiveErrorAction
  | ReceiveWorkspacesAction
  | UpdateWorkspaceAction
  | DeleteWorkspaceAction
  | AddWorkspaceAction
  | SetWorkspaceQualifiedName
  | ClearWorkspaceQualifiedName
  | SetWorkspaceUID
  | ClearWorkspaceUID
  | DeleteWorkspaceLogsAction;

export type ResourceQueryParams = {
  'debug-workspace-start': boolean;
  [propName: string]: string | boolean | undefined;
};
export type ActionCreators = {
  requestWorkspaces: () => AppThunk<KnownAction, Promise<void>>;
  requestWorkspace: (workspace: Workspace) => AppThunk<KnownAction, Promise<void>>;
  startWorkspace: (
    workspace: Workspace,
    params?: ResourceQueryParams,
  ) => AppThunk<KnownAction, Promise<void>>;
  restartWorkspace: (workspace: Workspace) => AppThunk<KnownAction, Promise<void>>;
  stopWorkspace: (workspace: Workspace) => AppThunk<KnownAction, Promise<void>>;
  deleteWorkspace: (workspace: Workspace) => AppThunk<KnownAction, Promise<void>>;
  updateWorkspace: (workspace: Workspace) => AppThunk<KnownAction, Promise<void>>;
  updateWorkspaceWithDefaultDevfile: (workspace: Workspace) => AppThunk<KnownAction, Promise<void>>;
  createWorkspaceFromDevfile: (
    devfile: devfileApi.Devfile,
    attributes: Partial<FactoryParams>,
    optionalFilesContent?: {
      [fileName: string]: string;
    },
  ) => AppThunk<KnownAction, Promise<void>>;

  setWorkspaceQualifiedName: (
    namespace: string,
    workspaceName: string,
  ) => AppThunk<SetWorkspaceQualifiedName>;
  clearWorkspaceQualifiedName: () => AppThunk<ClearWorkspaceQualifiedName>;
  setWorkspaceUID: (workspaceUID: string) => AppThunk<SetWorkspaceUID>;
  clearWorkspaceUID: () => AppThunk<ClearWorkspaceUID>;
};

export const actionCreators: ActionCreators = {
  requestWorkspaces:
    (): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      dispatch({ type: 'REQUEST_WORKSPACES' });
      try {
        await dispatch(DevWorkspacesStore.actionCreators.requestWorkspaces());

        dispatch({ type: 'RECEIVE_WORKSPACES' });
      } catch (e) {
        dispatch({ type: 'RECEIVE_ERROR' });
        throw e;
      }
    },

  requestWorkspace:
    (workspace: Workspace): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      dispatch({ type: 'REQUEST_WORKSPACES' });
      try {
        await dispatch(DevWorkspacesStore.actionCreators.requestWorkspace(workspace.ref));
        dispatch({ type: 'UPDATE_WORKSPACE' });
      } catch (e) {
        dispatch({ type: 'RECEIVE_ERROR' });
        throw e;
      }
    },

  startWorkspace:
    (workspace: Workspace, params?: ResourceQueryParams): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      dispatch({ type: 'REQUEST_WORKSPACES' });
      const debugWorkspace = params && params['debug-workspace-start'];
      await dispatch(
        DevWorkspacesStore.actionCreators.startWorkspace(workspace.ref, debugWorkspace),
      );
      dispatch({ type: 'UPDATE_WORKSPACE' });
    },

  restartWorkspace:
    (workspace: Workspace): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      try {
        await dispatch(DevWorkspacesStore.actionCreators.restartWorkspace(workspace.ref));
      } catch (e) {
        dispatch({ type: 'RECEIVE_ERROR' });
        throw e;
      }
    },

  stopWorkspace:
    (workspace: Workspace): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      try {
        await dispatch(DevWorkspacesStore.actionCreators.stopWorkspace(workspace.ref));
      } catch (e) {
        dispatch({ type: 'RECEIVE_ERROR' });
        throw e;
      }
    },

  deleteWorkspace:
    (workspace: Workspace): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      try {
        await dispatch(DevWorkspacesStore.actionCreators.terminateWorkspace(workspace.ref));
      } catch (e) {
        dispatch({ type: 'RECEIVE_ERROR' });
        throw e;
      }
    },

  updateWorkspace:
    (workspace: Workspace): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      dispatch({ type: 'REQUEST_WORKSPACES' });
      try {
        await dispatch(
          DevWorkspacesStore.actionCreators.updateWorkspace(
            workspace.ref as devfileApi.DevWorkspace,
          ),
        );
        dispatch({ type: 'UPDATE_WORKSPACE' });
      } catch (e) {
        dispatch({ type: 'RECEIVE_ERROR' });
        throw e;
      }
    },

  updateWorkspaceWithDefaultDevfile:
    (workspace: Workspace): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      dispatch({ type: 'REQUEST_WORKSPACES' });
      try {
        await dispatch(
          DevWorkspacesStore.actionCreators.updateWorkspaceWithDefaultDevfile(
            workspace.ref as devfileApi.DevWorkspace,
          ),
        );
        dispatch({ type: 'UPDATE_WORKSPACE' });
      } catch (e) {
        dispatch({ type: 'RECEIVE_ERROR' });
        throw e;
      }
    },

  createWorkspaceFromDevfile:
    (
      devfile: devfileApi.Devfile,
      attributes: Partial<FactoryParams>,
      optionalFilesContent?: {
        [fileName: string]: string;
      },
    ): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      dispatch({ type: 'REQUEST_WORKSPACES' });
      try {
        await dispatch(
          DevWorkspacesStore.actionCreators.createWorkspaceFromDevfile(
            devfile,
            attributes,
            optionalFilesContent || {},
          ),
        );
        dispatch({ type: 'ADD_WORKSPACE' });
      } catch (e) {
        dispatch({ type: 'RECEIVE_ERROR' });
        throw e;
      }
    },

  setWorkspaceQualifiedName:
    (namespace: string, workspaceName: string): AppThunk<SetWorkspaceQualifiedName> =>
    dispatch => {
      dispatch({
        type: 'SET_WORKSPACE_NAME',
        namespace,
        workspaceName,
      });
    },

  clearWorkspaceQualifiedName: (): AppThunk<ClearWorkspaceQualifiedName> => dispatch => {
    dispatch({ type: 'CLEAR_WORKSPACE_NAME' });
  },

  setWorkspaceUID:
    (workspaceUID: string): AppThunk<SetWorkspaceUID> =>
    dispatch => {
      dispatch({
        type: 'SET_WORKSPACE_UID',
        workspaceUID,
      });
    },

  clearWorkspaceUID: (): AppThunk<ClearWorkspaceUID> => dispatch => {
    dispatch({ type: 'CLEAR_WORKSPACE_UID' });
  },
};

const unloadedState: State = {
  isLoading: false,

  namespace: '',
  workspaceName: '',
  workspaceUID: '',

  recentNumber: 5,
};

export const reducer: Reducer<State> = (state: State | undefined, action: KnownAction): State => {
  if (state === undefined) {
    return unloadedState;
  }

  switch (action.type) {
    case 'REQUEST_WORKSPACES':
      return createObject<State>(state, {
        isLoading: true,
      });
    case 'RECEIVE_ERROR':
    case 'UPDATE_WORKSPACE':
    case 'ADD_WORKSPACE':
    case 'DELETE_WORKSPACE':
    case 'RECEIVE_WORKSPACES':
      return createObject<State>(state, {
        isLoading: false,
      });
    case 'SET_WORKSPACE_NAME':
      return createObject<State>(state, {
        namespace: action.namespace,
        workspaceName: action.workspaceName,
      });
    case 'CLEAR_WORKSPACE_NAME':
      return createObject<State>(state, {
        namespace: '',
        workspaceName: '',
      });
    case 'SET_WORKSPACE_UID':
      return createObject<State>(state, {
        workspaceUID: action.workspaceUID,
      });
    case 'CLEAR_WORKSPACE_UID':
      return createObject<State>(state, {
        workspaceUID: '',
      });
    default:
      return state;
  }
};
