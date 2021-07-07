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

import { Reducer } from 'redux';
import { AppThunk } from '../';
import { createState } from '../helpers';
import { IDevWorkspace, IDevWorkspaceDevfile } from '@eclipse-che/devworkspace-client';
import {
  convertWorkspace,
  isWorkspaceV2,
  isDevfileV2,
  Workspace,
  isWorkspaceV1,
} from '../../services/workspaceAdapter';
import * as CheWorkspacesStore from './cheWorkspaces';
import * as DevWorkspacesStore from './devWorkspaces';

// This state defines the type of data maintained in the Redux store.
export interface State {
  isLoading: boolean;

  // current workspace qualified name
  namespace: string;
  workspaceName: string;
  workspaceId: string;
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
  workspaceId: string;
}

interface DeleteWorkspaceAction {
  type: 'DELETE_WORKSPACE';
  workspaceId: string;
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

interface SetWorkspaceId {
  type: 'SET_WORKSPACE_ID';
  workspaceId: string;
}

interface ClearWorkspaceId {
  type: 'CLEAR_WORKSPACE_ID';
}

type KnownAction =
  RequestWorkspacesAction
  | ReceiveErrorAction
  | ReceiveWorkspacesAction
  | UpdateWorkspaceAction
  | DeleteWorkspaceAction
  | AddWorkspaceAction
  | SetWorkspaceQualifiedName
  | ClearWorkspaceQualifiedName
  | SetWorkspaceId
  | ClearWorkspaceId
  | DeleteWorkspaceLogsAction;

export type ResourceQueryParams = {
  'debug-workspace-start': boolean;
  [propName: string]: string | boolean | undefined;
}
export type ActionCreators = {
  requestWorkspaces: () => AppThunk<KnownAction, Promise<void>>;
  requestWorkspace: (workspace: Workspace) => AppThunk<KnownAction, Promise<void>>;
  startWorkspace: (workspace: Workspace, params?: ResourceQueryParams) => AppThunk<KnownAction, Promise<void>>;
  restartWorkspace: (workspace: Workspace) => AppThunk<KnownAction, Promise<void>>;
  stopWorkspace: (workspace: Workspace) => AppThunk<KnownAction, Promise<void>>;
  deleteWorkspace: (workspace: Workspace) => AppThunk<KnownAction, Promise<void>>;
  updateWorkspace: (workspace: Workspace) => AppThunk<KnownAction, Promise<void>>;
  createWorkspaceFromDevfile: (
    devfile: che.WorkspaceDevfile | IDevWorkspaceDevfile,
    namespace: string | undefined,
    infrastructureNamespace: string | undefined,
    attributes: { [key: string]: string } | {},
    optionalFilesContent?: {
      [fileName: string]: string
    }
  ) => AppThunk<KnownAction, Promise<Workspace>>;

  setWorkspaceQualifiedName: (namespace: string, workspaceName: string) => AppThunk<SetWorkspaceQualifiedName>;
  clearWorkspaceQualifiedName: () => AppThunk<ClearWorkspaceQualifiedName>;
  setWorkspaceId: (workspaceId: string) => AppThunk<SetWorkspaceId>;
  clearWorkspaceId: () => AppThunk<ClearWorkspaceId>;
  deleteWorkspaceLogs: (workspaceId: string) => AppThunk<DeleteWorkspaceLogsAction>;
};

export const actionCreators: ActionCreators = {

  requestWorkspaces: (): AppThunk<KnownAction, Promise<void>> => async (dispatch, getState): Promise<void> => {
    dispatch({ type: 'REQUEST_WORKSPACES' });
    try {
      const state = getState();
      const cheDevworkspaceEnabled = state.workspacesSettings.settings['che.devworkspaces.enabled'] === 'true';
      let requestDevWorkspaces: Promise<any>;
      if (cheDevworkspaceEnabled) {
        requestDevWorkspaces = dispatch(DevWorkspacesStore.actionCreators.requestWorkspaces());
      } else {
        requestDevWorkspaces = Promise.resolve([]);
      }

      await Promise.all([
        dispatch(CheWorkspacesStore.actionCreators.requestWorkspaces()),
        requestDevWorkspaces,
      ]);

      dispatch({ type: 'RECEIVE_WORKSPACES' });
    } catch (e) {
      dispatch({ type: 'RECEIVE_ERROR' });
      throw e;
    }
  },

  requestWorkspace: (workspace: Workspace): AppThunk<KnownAction, Promise<void>> => async (dispatch, getState): Promise<void> => {
    dispatch({ type: 'REQUEST_WORKSPACES' });
    try {
      const state = getState();
      const cheDevworkspaceEnabled = state.workspacesSettings.settings['che.devworkspaces.enabled'] === 'true';

      if (cheDevworkspaceEnabled && isWorkspaceV2(workspace.ref)) {
        await dispatch(DevWorkspacesStore.actionCreators.requestWorkspace(workspace.ref));
      } else {
        await dispatch(CheWorkspacesStore.actionCreators.requestWorkspace(workspace.ref as che.Workspace));
      }
      dispatch({ type: 'UPDATE_WORKSPACE' });
    } catch (e) {
      dispatch({ type: 'RECEIVE_ERROR' });
      throw e;
    }
  },

  startWorkspace: (workspace: Workspace, params?: ResourceQueryParams): AppThunk<KnownAction, Promise<void>> => async (dispatch, getState): Promise<void> => {
    dispatch({ type: 'REQUEST_WORKSPACES' });
    try {
      const state = getState();
      const cheDevworkspaceEnabled = state.workspacesSettings.settings['che.devworkspaces.enabled'] === 'true';

      if (cheDevworkspaceEnabled && isWorkspaceV2(workspace.ref)) {
        await dispatch(DevWorkspacesStore.actionCreators.startWorkspace(workspace.ref));
      } else {
        await dispatch(CheWorkspacesStore.actionCreators.startWorkspace(workspace as che.Workspace, params));
      }
      dispatch({ type: 'UPDATE_WORKSPACE' });
    } catch (e) {
      dispatch({ type: 'RECEIVE_ERROR' });
      throw e;
    }
  },

  restartWorkspace: (workspace: Workspace): AppThunk<KnownAction, Promise<void>> => async (dispatch, getState): Promise<void> => {
    try {
      const state = getState();
      const cheDevworkspaceEnabled = state.workspacesSettings.settings['che.devworkspaces.enabled'] === 'true';
      if (cheDevworkspaceEnabled && isWorkspaceV2(workspace.ref)) {
        await dispatch(DevWorkspacesStore.actionCreators.restartWorkspace(workspace.ref));
      } else {
        await dispatch(CheWorkspacesStore.actionCreators.restartWorkspace(workspace.ref as che.Workspace));
      }
    } catch (e) {
      dispatch({ type: 'RECEIVE_ERROR' });
      throw e;
    }
  },

  stopWorkspace: (workspace: Workspace): AppThunk<KnownAction, Promise<void>> => async (dispatch, getState): Promise<void> => {
    try {
      const state = getState();
      const cheDevworkspaceEnabled = state.workspacesSettings.settings['che.devworkspaces.enabled'] === 'true';
      if (cheDevworkspaceEnabled && isWorkspaceV2(workspace.ref)) {
        await dispatch(DevWorkspacesStore.actionCreators.stopWorkspace(workspace.ref));
      } else {
        await dispatch(CheWorkspacesStore.actionCreators.stopWorkspace(workspace.ref as che.Workspace));
        // cheWorkspaceClient.restApiClient.stop(workspace.id);
      }
    } catch (e) {
      dispatch({ type: 'RECEIVE_ERROR' });
      throw e;
    }
  },

  deleteWorkspace: (workspace: Workspace): AppThunk<KnownAction, Promise<void>> => async (dispatch, getState): Promise<void> => {
    try {
      const state = getState();
      const cheDevworkspaceEnabled = state.workspacesSettings.settings['che.devworkspaces.enabled'] === 'true';
      if (cheDevworkspaceEnabled && isWorkspaceV2(workspace.ref)) {
        await dispatch(DevWorkspacesStore.actionCreators.terminateWorkspace(workspace.ref));
      } else {
        await dispatch(CheWorkspacesStore.actionCreators.deleteWorkspace(workspace.ref as che.Workspace));
      }
    } catch (e) {
      dispatch({ type: 'RECEIVE_ERROR' });
      throw e;
    }
  },

  updateWorkspace: (workspace: Workspace): AppThunk<KnownAction, Promise<void>> => async (dispatch): Promise<void> => {
    dispatch({ type: 'REQUEST_WORKSPACES' });
    try {
      if (isWorkspaceV1(workspace.ref)) {
        await dispatch(CheWorkspacesStore.actionCreators.updateWorkspace(workspace.ref as che.Workspace));
      } else {
        await dispatch(DevWorkspacesStore.actionCreators.updateWorkspace(workspace.ref as IDevWorkspace));
      }
      dispatch({ type: 'UPDATE_WORKSPACE' });
    } catch (e) {
      dispatch({ type: 'RECEIVE_ERROR' });
      throw e;
    }
  },

  createWorkspaceFromDevfile: (
    devfile: che.WorkspaceDevfile | IDevWorkspaceDevfile,
    namespace: string | undefined,
    infrastructureNamespace: string | undefined,
    attributes: { [key: string]: string } = {},
    optionalFilesContent?: {
      [fileName: string]: string
    }
  ): AppThunk<KnownAction, Promise<Workspace>> => async (dispatch, getState): Promise<Workspace> => {
    dispatch({ type: 'REQUEST_WORKSPACES' });
    try {
      const state = getState();

      const cheDevworkspaceEnabled = state.workspacesSettings.settings['che.devworkspaces.enabled'] === 'true';
      if (cheDevworkspaceEnabled && isDevfileV2(devfile)) {
        const pluginRegistryUrl = state.workspacesSettings.settings['cheWorkspacePluginRegistryUrl'];
        const devWorkspace = await dispatch(DevWorkspacesStore.actionCreators.createWorkspaceFromDevfile(devfile, optionalFilesContent || {}, pluginRegistryUrl));
        dispatch({ type: 'ADD_WORKSPACE' });
        return convertWorkspace(devWorkspace);
      } else {
        const cheWorkspace = await dispatch(CheWorkspacesStore.actionCreators.createWorkspaceFromDevfile(devfile as che.WorkspaceDevfile, namespace, infrastructureNamespace, attributes));
        dispatch({
          type: 'ADD_WORKSPACE',
        });
        return convertWorkspace(cheWorkspace);
      }
    } catch (e) {
      dispatch({ type: 'RECEIVE_ERROR' });
      throw e;
    }
  },

  setWorkspaceQualifiedName: (namespace: string, workspaceName: string): AppThunk<SetWorkspaceQualifiedName> => dispatch => {
    dispatch({
      type: 'SET_WORKSPACE_NAME',
      namespace,
      workspaceName,
    });
  },

  clearWorkspaceQualifiedName: (): AppThunk<ClearWorkspaceQualifiedName> => dispatch => {
    dispatch({ type: 'CLEAR_WORKSPACE_NAME' });
  },

  setWorkspaceId: (workspaceId: string): AppThunk<SetWorkspaceId> => dispatch => {
    dispatch({
      type: 'SET_WORKSPACE_ID',
      workspaceId,
    });
  },

  clearWorkspaceId: (): AppThunk<ClearWorkspaceId> => dispatch => {
    dispatch({ type: 'CLEAR_WORKSPACE_ID' });
  },

  deleteWorkspaceLogs: (workspaceId: string): AppThunk<KnownAction> => (_dispatch, getState): void => {
    const state = getState();
    const cheDevworkspaceEnabled = state.workspacesSettings.settings['che.devworkspaces.enabled'] === 'true';
    if (cheDevworkspaceEnabled) {
      DevWorkspacesStore.actionCreators.deleteWorkspaceLogs(workspaceId);
    }

    CheWorkspacesStore.actionCreators.deleteWorkspaceLogs(workspaceId);
  },

};

const unloadedState: State = {
  isLoading: false,

  namespace: '',
  workspaceName: '',
  workspaceId: '',

  recentNumber: 5,
};

export const reducer: Reducer<State> = (state: State | undefined, action: KnownAction): State => {
  if (state === undefined) {
    return unloadedState;
  }

  switch (action.type) {
    case 'REQUEST_WORKSPACES':
      return createState(state, {
        isLoading: true,
      });
    case 'RECEIVE_ERROR':
      return createState(state, {
        isLoading: false,
      });
    case 'UPDATE_WORKSPACE':
      return createState(state, {
        isLoading: false,
      });
    case 'ADD_WORKSPACE':
      return createState(state, {
        isLoading: false,
      });
    case 'DELETE_WORKSPACE':
      return createState(state, {
        isLoading: false,
      });
    case 'RECEIVE_WORKSPACES':
      return createState(state, {
        isLoading: false,
      });
    case 'SET_WORKSPACE_NAME':
      return createState(state, {
        namespace: action.namespace,
        workspaceName: action.workspaceName,
      });
    case 'CLEAR_WORKSPACE_NAME':
      return createState(state, {
        namespace: '',
        workspaceName: '',
      });
    case 'SET_WORKSPACE_ID':
      return createState(state, {
        workspaceId: action.workspaceId,
      });
    case 'CLEAR_WORKSPACE_ID':
      return createState(state, {
        workspaceId: '',
      });
    default:
      return state;
  }

};
