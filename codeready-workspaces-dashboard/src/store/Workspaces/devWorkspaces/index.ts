/*
 * Copyright (c) 2018-2020 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { Action, Reducer } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { AppThunk } from '../..';
import { container } from '../../../inversify.config';
import { DevWorkspaceStatus, WorkspaceStatus } from '../../../services/helpers/types';
import { createState } from '../../helpers';
import { DevWorkspaceClient, DEVWORKSPACE_NEXT_START_ANNOTATION, IStatusUpdate } from '../../../services/workspace-client/devWorkspaceClient';
import { CheWorkspaceClient } from '../../../services/workspace-client/cheWorkspaceClient';
import { IDevWorkspace, IDevWorkspaceDevfile } from '@eclipse-che/devworkspace-client';
import { deleteLogs, mergeLogs } from '../logs';
import { getErrorMessage } from '../../../services/helpers/getErrorMessage';

const cheWorkspaceClient = container.get(CheWorkspaceClient);
const devWorkspaceClient = container.get(DevWorkspaceClient);

export interface State {
  isLoading: boolean;
  workspaces: IDevWorkspace[];
  error?: string;
  // runtime logs
  workspacesLogs: Map<string, string[]>;
}

interface RequestDevWorkspacesAction extends Action {
  type: 'DEV_REQUEST_WORKSPACES';
}

interface ReceiveErrorAction extends Action {
  type: 'DEV_RECEIVE_ERROR';
  error: string;
}

interface ReceiveWorkspacesAction extends Action {
  type: 'DEV_RECEIVE_WORKSPACES';
  workspaces: IDevWorkspace[];
}

interface UpdateWorkspaceAction extends Action {
  type: 'DEV_UPDATE_WORKSPACE';
  workspace: IDevWorkspace;
}

interface UpdateWorkspaceStatusAction extends Action {
  type: 'DEV_UPDATE_WORKSPACE_STATUS';
  workspaceId: string;
  status: string;
}

interface UpdateWorkspacesLogsAction extends Action {
  type: 'DEV_UPDATE_WORKSPACES_LOGS';
  workspacesLogs: Map<string, string[]>;
}

interface DeleteWorkspaceLogsAction extends Action {
  type: 'DEV_DELETE_WORKSPACE_LOGS';
  workspaceId: string;
}

interface DeleteWorkspaceAction extends Action {
  type: 'DEV_DELETE_WORKSPACE';
  workspaceId: string;
}

interface AddWorkspaceAction extends Action {
  type: 'DEV_ADD_WORKSPACE';
  workspace: IDevWorkspace;
}

type KnownAction =
  RequestDevWorkspacesAction
  | ReceiveErrorAction
  | ReceiveWorkspacesAction
  | UpdateWorkspaceAction
  | DeleteWorkspaceAction
  | AddWorkspaceAction
  | UpdateWorkspaceStatusAction
  | UpdateWorkspacesLogsAction
  | DeleteWorkspaceLogsAction;

export type ResourceQueryParams = {
  'debug-workspace-start': boolean;
  [propName: string]: string | boolean | undefined;
}
export type ActionCreators = {
  updateDevWorkspaceStatus: (workspace: IDevWorkspace, message: IStatusUpdate) => AppThunk<KnownAction, void>;
  requestWorkspaces: () => AppThunk<KnownAction, Promise<void>>;
  requestWorkspace: (workspace: IDevWorkspace) => AppThunk<KnownAction, Promise<void>>;
  startWorkspace: (workspace: IDevWorkspace) => AppThunk<KnownAction, Promise<void>>;
  stopWorkspace: (workspace: IDevWorkspace) => AppThunk<KnownAction, Promise<void>>;
  deleteWorkspace: (workspace: IDevWorkspace) => AppThunk<KnownAction, Promise<void>>;
  updateWorkspace: (workspace: IDevWorkspace) => AppThunk<KnownAction, Promise<void>>;
  createWorkspaceFromDevfile: (devfile: IDevWorkspaceDevfile) => AppThunk<KnownAction, Promise<IDevWorkspace>>;

  deleteWorkspaceLogs: (workspaceId: string) => AppThunk<DeleteWorkspaceLogsAction, void>;
};

export const actionCreators: ActionCreators = {

  updateDevWorkspaceStatus: (workspace: IDevWorkspace, message: IStatusUpdate): AppThunk<KnownAction, void> => (dispatch): void => {
    onStatusUpdateReceived(workspace, dispatch, message);
  },

  requestWorkspaces: (): AppThunk<KnownAction, Promise<void>> => async (dispatch): Promise<void> => {
    dispatch({ type: 'DEV_REQUEST_WORKSPACES' });

    try {
      const defaultNamespace = await cheWorkspaceClient.getDefaultNamespace();
      const workspaces = await devWorkspaceClient.getAllWorkspaces(defaultNamespace);

      dispatch({
        type: 'DEV_RECEIVE_WORKSPACES',
        workspaces,
      });
    } catch (e) {
      const errorMessage = 'Failed to fetch available workspaces, reason: ' + getErrorMessage(e);
      dispatch({
        type: 'DEV_RECEIVE_ERROR',
        error: errorMessage,
      });
      throw errorMessage;
    }

  },

  requestWorkspace: (workspace: IDevWorkspace): AppThunk<KnownAction, Promise<void>> => async (dispatch): Promise<void> => {
    dispatch({ type: 'DEV_REQUEST_WORKSPACES' });

    try {
      const namespace = workspace.metadata.namespace;
      const name = workspace.metadata.name;
      const update = await devWorkspaceClient.getWorkspaceByName(namespace, name);
      dispatch({
        type: 'DEV_UPDATE_WORKSPACE',
        workspace: update,
      });
    } catch (e) {
      const errorMessage = `Failed to fetch the workspace with ID: ${workspace.status.devworkspaceId}, reason: ` + getErrorMessage(e);
      dispatch({
        type: 'DEV_RECEIVE_ERROR',
        error: errorMessage,
      });
      throw errorMessage;
    }
  },

  startWorkspace: (workspace: IDevWorkspace): AppThunk<KnownAction, Promise<void>> => async (dispatch, getState): Promise<void> => {
    dispatch({ type: 'DEV_REQUEST_WORKSPACES' });
    try {
      let updatedWorkspace: IDevWorkspace;
      if (workspace.metadata.annotations && workspace.metadata.annotations[DEVWORKSPACE_NEXT_START_ANNOTATION]) {
        // If the workspace has DEVWORKSPACE_NEXT_START_ANNOTATION then update the devworkspace with the DEVWORKSPACE_NEXT_START_ANNOTATION annotation value and then start the devworkspace
        const state = getState();
        const plugins = state.dwPlugins.plugins;
        const storedDevWorkspace = JSON.parse(workspace.metadata.annotations[DEVWORKSPACE_NEXT_START_ANNOTATION]) as IDevWorkspace;
        delete workspace.metadata.annotations[DEVWORKSPACE_NEXT_START_ANNOTATION];
        workspace.spec.template = storedDevWorkspace.spec.template;
        workspace.spec.started = true;
        updatedWorkspace = await devWorkspaceClient.update(workspace, plugins);
      } else {
        updatedWorkspace = await devWorkspaceClient.changeWorkspaceStatus(workspace.metadata.namespace, workspace.metadata.name, true);
      }
      dispatch({
        type: 'DEV_UPDATE_WORKSPACE',
        workspace: updatedWorkspace,
      });
    } catch (e) {
      const errorMessage = getErrorMessage(e);
      throw errorMessage;
    }
  },

  stopWorkspace: (workspace: IDevWorkspace): AppThunk<KnownAction, Promise<void>> => async (dispatch): Promise<void> => {
    try {
      devWorkspaceClient.changeWorkspaceStatus(workspace.metadata.namespace, workspace.metadata.name, false);
      dispatch({ type: 'DEV_DELETE_WORKSPACE_LOGS', workspaceId: workspace.status.devworkspaceId });
    } catch (e) {
      const errorMessage = `Failed to stop the workspace with ID: ${workspace.status.devworkspaceId}, reason: ` + getErrorMessage(e);
      throw errorMessage;
    }
  },

  deleteWorkspace: (workspace: IDevWorkspace): AppThunk<KnownAction, Promise<void>> => async (dispatch): Promise<void> => {
    try {
      const namespace = workspace.metadata.namespace;
      const name = workspace.metadata.name;
      await devWorkspaceClient.delete(namespace, name);
      const workspaceId = workspace.status.devworkspaceId;
      dispatch({
        type: 'DEV_DELETE_WORKSPACE',
        workspaceId,
      });
      dispatch({ type: 'DEV_DELETE_WORKSPACE_LOGS', workspaceId });
    } catch (e) {
      const resMessage = `Failed to delete the workspace with ID: ${workspace.status.devworkspaceId}, reason: ` + getErrorMessage(e);
      throw resMessage;
    }
  },

  updateWorkspace: (workspace: IDevWorkspace): AppThunk<KnownAction, Promise<void>> => async (dispatch, getState): Promise<void> => {
    dispatch({ type: 'DEV_REQUEST_WORKSPACES' });

    try {
      const state = getState();
      const plugins = state.dwPlugins.plugins;
      const updated = await devWorkspaceClient.update(workspace, plugins);
      dispatch({
        type: 'DEV_UPDATE_WORKSPACE',
        workspace: updated,
      });
    } catch (e) {
      const errorMessage = `Failed to update the workspace with ID: ${workspace.status.devworkspaceId}, reason: ` + getErrorMessage(e);
      throw errorMessage;
    }
  },

  createWorkspaceFromDevfile: (devfile: IDevWorkspaceDevfile): AppThunk<KnownAction, Promise<IDevWorkspace>> => async (dispatch, getState): Promise<IDevWorkspace> => {
    dispatch({ type: 'DEV_REQUEST_WORKSPACES' });
    try {
      const state = getState();

      // If the devworkspace doesn't have a namespace then we assign it to the default kubernetesNamespace
      const devWorkspaceDevfile = devfile as IDevWorkspaceDevfile;
      if (!devWorkspaceDevfile.metadata.namespace) {
        const defaultNamespace = await cheWorkspaceClient.getDefaultNamespace();
        devWorkspaceDevfile.metadata.namespace = defaultNamespace;
      }

      const dwPlugins = state.dwPlugins.plugins;
      const workspace = await devWorkspaceClient.create(devWorkspaceDevfile, dwPlugins);

      dispatch({
        type: 'DEV_ADD_WORKSPACE',
        workspace,
      });
      return workspace;
    } catch (e) {
      const errorMessage = 'Failed to create a new workspace from the devfile, reason: ' + getErrorMessage(e);
      throw errorMessage;
    }
  },

  deleteWorkspaceLogs: (workspaceId: string): AppThunk<DeleteWorkspaceLogsAction, void> => (dispatch): void => {
    dispatch({ type: 'DEV_DELETE_WORKSPACE_LOGS', workspaceId });
  },

};

const unloadedState: State = {
  workspaces: [],
  isLoading: false,

  workspacesLogs: new Map<string, string[]>(),
};

export const reducer: Reducer<State> = (state: State | undefined, action: KnownAction): State => {
  if (state === undefined) {
    return unloadedState;
  }

  switch (action.type) {
    case 'DEV_REQUEST_WORKSPACES':
      return createState(state, {
        isLoading: true,
        error: undefined,
      });
    case 'DEV_RECEIVE_WORKSPACES':
      return createState(state, {
        isLoading: false,
        workspaces: action.workspaces,
      });
    case 'DEV_RECEIVE_ERROR':
      return createState(state, {
        isLoading: false,
        error: action.error,
      });
    case 'DEV_UPDATE_WORKSPACE':
      return createState(state, {
        isLoading: false,
        workspaces: state.workspaces.map(workspace => workspace.status.devworkspaceId === action.workspace.status.devworkspaceId ? action.workspace : workspace),
      });
    case 'DEV_UPDATE_WORKSPACE_STATUS':
      return createState(state, {
        workspaces: state.workspaces.map(workspace => {
          if (workspace.status.devworkspaceId === action.workspaceId) {
            workspace.status.phase = action.status;
          }
          return workspace;
        }),
      });
    case 'DEV_ADD_WORKSPACE':
      return createState(state, {
        workspaces: state.workspaces.concat([action.workspace]),
      });
    case 'DEV_DELETE_WORKSPACE':
      return createState(state, {
        isLoading: false,
        workspaces: state.workspaces.filter(workspace => workspace.status.devworkspaceId !== action.workspaceId),
      });
    case 'DEV_UPDATE_WORKSPACES_LOGS':
      return createState(state, {
        workspacesLogs: mergeLogs(state.workspacesLogs, action.workspacesLogs),
      });
    case 'DEV_DELETE_WORKSPACE_LOGS':
      return createState(state, {
        workspacesLogs: deleteLogs(state.workspacesLogs, action.workspaceId),
      });
    default:
      return state;
  }

};

function onStatusUpdateReceived(
  workspace: IDevWorkspace,
  dispatch: ThunkDispatch<State, undefined, KnownAction>,
  statusUpdate: IStatusUpdate) {
  let status: string | undefined;
  if (statusUpdate.error) {
    const workspacesLogs = new Map<string, string[]>();
    workspacesLogs.set(workspace.status.devworkspaceId, [`Error: Failed to run the workspace: "${statusUpdate.error}"`]);
    dispatch({
      type: 'DEV_UPDATE_WORKSPACES_LOGS',
      workspacesLogs,
    });
    status = WorkspaceStatus[WorkspaceStatus.ERROR];
  } else {
    if (statusUpdate.message) {
      const workspacesLogs = new Map<string, string[]>();

      /**
       * Don't add in messages with no workspaces id or with stopped or stopping messages. The stopped and stopping messages
       * only appear because we initially create a stopped devworkspace, add in devworkspace templates, and then start the devworkspace
       */
      if (workspace.status.devworkspaceId !== '' && workspace.status.message !== DevWorkspaceStatus.STOPPED && workspace.status.message !== DevWorkspaceStatus.STOPPING) {
        workspacesLogs.set(workspace.status.devworkspaceId, [statusUpdate.message]);
        dispatch({
          type: 'DEV_UPDATE_WORKSPACES_LOGS',
          workspacesLogs,
        });
      }
    }
    status = statusUpdate.status;
  }
  if (status && WorkspaceStatus[status]) {
    dispatch({
      type: 'DEV_UPDATE_WORKSPACE_STATUS',
      workspaceId: workspace.status.devworkspaceId,
      status,
    });
  }
}
