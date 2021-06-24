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

import { Action, Reducer } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { AppThunk } from '../..';
import { container } from '../../../inversify.config';
import { DevWorkspaceStatus } from '../../../services/helpers/types';
import { createState } from '../../helpers';
import { DevWorkspaceClient, DEVWORKSPACE_NEXT_START_ANNOTATION, IStatusUpdate } from '../../../services/workspace-client/devWorkspaceClient';
import { CheWorkspaceClient } from '../../../services/workspace-client/cheWorkspaceClient';
import { IDevWorkspace, IDevWorkspaceDevfile } from '@eclipse-che/devworkspace-client';
import { deleteLogs, mergeLogs } from '../logs';
import { getErrorMessage } from '../../../services/helpers/getErrorMessage';

const cheWorkspaceClient = container.get(CheWorkspaceClient);
const devWorkspaceClient = container.get(DevWorkspaceClient);

const devWorkspaceStatusMap = new Map<string, string | undefined>();

export interface State {
  isLoading: boolean;
  workspaces: IDevWorkspace[];
  error?: string;
  // runtime logs
  workspacesLogs: Map<string, string[]>;
}

interface RequestDevWorkspacesAction extends Action {
  type: 'REQUEST_DEVWORKSPACE';
}

interface ReceiveErrorAction extends Action {
  type: 'RECEIVE_DEVWORKSPACE_ERROR';
  error: string;
}

interface ReceiveWorkspacesAction extends Action {
  type: 'RECEIVE_DEVWORKSPACE';
  workspaces: IDevWorkspace[];
}

interface UpdateWorkspaceAction extends Action {
  type: 'UPDATE_DEVWORKSPACE';
  workspace: IDevWorkspace;
}

interface UpdateWorkspaceStatusAction extends Action {
  type: 'UPDATE_DEVWORKSPACE_STATUS';
  workspaceId: string;
  status: string;
}

interface UpdateWorkspacesLogsAction extends Action {
  type: 'UPDATE_DEVWORKSPACE_LOGS';
  workspacesLogs: Map<string, string[]>;
}

interface DeleteWorkspaceLogsAction extends Action {
  type: 'DELETE_DEVWORKSPACE_LOGS';
  workspaceId: string;
}

interface DeleteWorkspaceAction extends Action {
  type: 'DELETE_DEVWORKSPACE';
  workspaceId: string;
}

interface TerminateWorkspaceAction extends Action {
  type: 'TERMINATE_DEVWORKSPACE';
  workspaceId: string;
}

interface AddWorkspaceAction extends Action {
  type: 'ADD_DEVWORKSPACE';
  workspace: IDevWorkspace;
}

type KnownAction =
  RequestDevWorkspacesAction
  | ReceiveErrorAction
  | ReceiveWorkspacesAction
  | UpdateWorkspaceAction
  | DeleteWorkspaceAction
  | TerminateWorkspaceAction
  | AddWorkspaceAction
  | UpdateWorkspaceStatusAction
  | UpdateWorkspacesLogsAction
  | DeleteWorkspaceLogsAction;

export type ResourceQueryParams = {
  'debug-workspace-start': boolean;
  [propName: string]: string | boolean | undefined;
}
export type ActionCreators = {
  updateAddedDevWorkspaces: (workspace: IDevWorkspace[]) => AppThunk<KnownAction, void>;
  updateDeletedDevWorkspaces: (deletedWorkspacesIds: string[]) => AppThunk<KnownAction, void>;
  updateDevWorkspaceStatus: (workspace: IDevWorkspace, message: IStatusUpdate) => AppThunk<KnownAction, void>;
  requestWorkspaces: () => AppThunk<KnownAction, Promise<void>>;
  requestWorkspace: (workspace: IDevWorkspace) => AppThunk<KnownAction, Promise<void>>;
  startWorkspace: (workspace: IDevWorkspace) => AppThunk<KnownAction, Promise<void>>;
  stopWorkspace: (workspace: IDevWorkspace) => AppThunk<KnownAction, Promise<void>>;
  terminateWorkspace: (workspace: IDevWorkspace) => AppThunk<KnownAction, Promise<void>>;
  updateWorkspace: (workspace: IDevWorkspace) => AppThunk<KnownAction, Promise<void>>;
  createWorkspaceFromDevfile: (devfile: IDevWorkspaceDevfile, optionalFilesContent: {
    [fileName: string]: string
  },
    pluginRegistryUrl: string | undefined,
  ) => AppThunk<KnownAction, Promise<IDevWorkspace>>;

  deleteWorkspaceLogs: (workspaceId: string) => AppThunk<DeleteWorkspaceLogsAction, void>;
};

export const actionCreators: ActionCreators = {

  updateAddedDevWorkspaces: (workspaces: IDevWorkspace[]): AppThunk<KnownAction, void> => (dispatch): void => {
    workspaces.forEach(workspace => {
      dispatch({
        type: 'ADD_DEVWORKSPACE',
        workspace,
      });
    });
  },

  updateDeletedDevWorkspaces: (deletedWorkspacesIds: string[]): AppThunk<KnownAction, void> => (dispatch): void => {
    deletedWorkspacesIds.forEach(workspaceId => {
      dispatch({
        type: 'DELETE_DEVWORKSPACE',
        workspaceId,
      });
    });
  },

  updateDevWorkspaceStatus: (workspace: IDevWorkspace, message: IStatusUpdate): AppThunk<KnownAction, void> => (dispatch): void => {
    onStatusUpdateReceived(workspace, dispatch, message);
  },

  requestWorkspaces: (): AppThunk<KnownAction, Promise<void>> => async (dispatch): Promise<void> => {
    dispatch({ type: 'REQUEST_DEVWORKSPACE' });

    try {
      const defaultNamespace = await cheWorkspaceClient.getDefaultNamespace();
      const workspaces = await devWorkspaceClient.getAllWorkspaces(defaultNamespace);

      dispatch({
        type: 'RECEIVE_DEVWORKSPACE',
        workspaces,
      });
    } catch (e) {
      const errorMessage = 'Failed to fetch available workspaces, reason: ' + getErrorMessage(e);
      dispatch({
        type: 'RECEIVE_DEVWORKSPACE_ERROR',
        error: errorMessage,
      });
      throw errorMessage;
    }

  },

  requestWorkspace: (workspace: IDevWorkspace): AppThunk<KnownAction, Promise<void>> => async (dispatch): Promise<void> => {
    dispatch({ type: 'REQUEST_DEVWORKSPACE' });

    try {
      const namespace = workspace.metadata.namespace;
      const name = workspace.metadata.name;
      const update = await devWorkspaceClient.getWorkspaceByName(namespace, name);
      dispatch({
        type: 'UPDATE_DEVWORKSPACE',
        workspace: update,
      });
    } catch (e) {
      const errorMessage = `Failed to fetch the workspace with ID: ${workspace.status.devworkspaceId}, reason: ` + getErrorMessage(e);
      dispatch({
        type: 'RECEIVE_DEVWORKSPACE_ERROR',
        error: errorMessage,
      });
      throw errorMessage;
    }
  },

  startWorkspace: (workspace: IDevWorkspace): AppThunk<KnownAction, Promise<void>> => async (dispatch, getState): Promise<void> => {
    dispatch({ type: 'REQUEST_DEVWORKSPACE' });
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
        type: 'UPDATE_DEVWORKSPACE',
        workspace: updatedWorkspace,
      });
    } catch (e) {
      const errorMessage = `Failed to start the workspace with ID: ${workspace.status.devworkspaceId}, reason: ` + getErrorMessage(e);
      dispatch({
        type: 'RECEIVE_DEVWORKSPACE_ERROR',
        error: errorMessage,
      });
      throw errorMessage;
    }
  },

  stopWorkspace: (workspace: IDevWorkspace): AppThunk<KnownAction, Promise<void>> => async (dispatch): Promise<void> => {
    try {
      devWorkspaceClient.changeWorkspaceStatus(workspace.metadata.namespace, workspace.metadata.name, false);
      dispatch({ type: 'DELETE_DEVWORKSPACE_LOGS', workspaceId: workspace.status.devworkspaceId });
    } catch (e) {
      const errorMessage = `Failed to stop the workspace with ID: ${workspace.status.devworkspaceId}, reason: ` + getErrorMessage(e);
      dispatch({
        type: 'RECEIVE_DEVWORKSPACE_ERROR',
        error: errorMessage,
      });
      throw errorMessage;
    }
  },

  terminateWorkspace: (workspace: IDevWorkspace): AppThunk<KnownAction, Promise<void>> => async (dispatch): Promise<void> => {
    try {
      const namespace = workspace.metadata.namespace;
      const name = workspace.metadata.name;
      await devWorkspaceClient.delete(namespace, name);
      const workspaceId = workspace.status.devworkspaceId;
      dispatch({
        type: 'TERMINATE_DEVWORKSPACE',
        workspaceId,
      });
      dispatch({ type: 'DELETE_DEVWORKSPACE_LOGS', workspaceId });
    } catch (e) {
      const errorMessage = e?.message || '';
      const code = e?.response?.status || '';
      const statusText = e?.response?.statusText || '';
      const responseMessage = e?.response?.data?.message || '';

      let message: string;
      if (responseMessage) {
        message = responseMessage;
      } else if (errorMessage) {
        message = errorMessage;
      } else if (code && statusText) {
        message = `Response code ${code}, ${statusText}.`;
      } else {
        message = 'Unknown error.';
      }

      const resMessage = `Failed to delete the workspace with ID: ${workspace.status.devworkspaceId}, reason: ` + message;
      dispatch({
        type: 'RECEIVE_DEVWORKSPACE_ERROR',
        error: resMessage,
      });

      throw resMessage;
    }
  },

  updateWorkspace: (workspace: IDevWorkspace): AppThunk<KnownAction, Promise<void>> => async (dispatch, getState): Promise<void> => {
    dispatch({ type: 'REQUEST_DEVWORKSPACE' });

    try {
      const state = getState();
      const plugins = state.dwPlugins.plugins;
      const updated = await devWorkspaceClient.update(workspace, plugins);
      dispatch({
        type: 'UPDATE_DEVWORKSPACE',
        workspace: updated,
      });
    } catch (e) {
      const errorMessage = `Failed to update the workspace with ID: ${workspace.status.devworkspaceId}, reason: ` + getErrorMessage(e);
      dispatch({
        type: 'RECEIVE_DEVWORKSPACE_ERROR',
        error: errorMessage,
      });
      throw errorMessage;
    }
  },

  createWorkspaceFromDevfile: (devfile: IDevWorkspaceDevfile, optionalFilesContent: {
    [fileName: string]: string
  },
    pluginRegistryUrl: string | undefined,
  ): AppThunk<KnownAction, Promise<IDevWorkspace>> => async (dispatch, getState): Promise<IDevWorkspace> => {
    dispatch({ type: 'REQUEST_DEVWORKSPACE' });
    try {
      const state = getState();

      // If the devworkspace doesn't have a namespace then we assign it to the default kubernetesNamespace
      const devWorkspaceDevfile = devfile as IDevWorkspaceDevfile;
      if (!devWorkspaceDevfile.metadata.namespace) {
        const defaultNamespace = await cheWorkspaceClient.getDefaultNamespace();
        devWorkspaceDevfile.metadata.namespace = defaultNamespace;
      }

      const dwPlugins = state.dwPlugins.plugins;
      const workspace = await devWorkspaceClient.create(devWorkspaceDevfile, dwPlugins, pluginRegistryUrl, optionalFilesContent);

      dispatch({
        type: 'ADD_DEVWORKSPACE',
        workspace,
      });
      return workspace;
    } catch (e) {
      const errorMessage = 'Failed to create a new workspace from the devfile, reason: ' + getErrorMessage(e);
      dispatch({
        type: 'RECEIVE_DEVWORKSPACE_ERROR',
        error: errorMessage,
      });
      throw errorMessage;
    }
  },

  deleteWorkspaceLogs: (workspaceId: string): AppThunk<DeleteWorkspaceLogsAction, void> => (dispatch): void => {
    dispatch({ type: 'DELETE_DEVWORKSPACE_LOGS', workspaceId });
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
    case 'REQUEST_DEVWORKSPACE':
      return createState(state, {
        isLoading: true,
        error: undefined,
      });
    case 'RECEIVE_DEVWORKSPACE':
      return createState(state, {
        isLoading: false,
        workspaces: action.workspaces,
      });
    case 'RECEIVE_DEVWORKSPACE_ERROR':
      return createState(state, {
        isLoading: false,
        error: action.error,
      });
    case 'UPDATE_DEVWORKSPACE':
      return createState(state, {
        isLoading: false,
        workspaces: state.workspaces.map(workspace => workspace.status.devworkspaceId === action.workspace.status.devworkspaceId ? action.workspace : workspace),
      });
    case 'UPDATE_DEVWORKSPACE_STATUS':
      return createState(state, {
        workspaces: state.workspaces.map(workspace => {
          if (workspace.status.devworkspaceId === action.workspaceId) {
            workspace.status.phase = action.status;
          }
          return workspace;
        }),
      });
    case 'ADD_DEVWORKSPACE':
      return createState(state, {
        workspaces: state.workspaces
          .filter(workspace => workspace.status.devworkspaceId !== action.workspace.status.devworkspaceId)
          .concat([action.workspace]),
      });
    case 'TERMINATE_DEVWORKSPACE':
      return createState(state, {
        isLoading: false,
        workspaces: state.workspaces.map(workspace => {
          if (workspace.status.devworkspaceId === action.workspaceId) {
            const targetWorkspace = Object.assign({}, workspace);
            targetWorkspace.status.phase = DevWorkspaceStatus.TERMINATING;
            return targetWorkspace;
          }
          return workspace;
        }),
      });
    case 'DELETE_DEVWORKSPACE':
      return createState(state, {
        workspaces: state.workspaces.filter(workspace => workspace.status.devworkspaceId !== action.workspaceId),
      });
    case 'UPDATE_DEVWORKSPACE_LOGS':
      return createState(state, {
        workspacesLogs: mergeLogs(state.workspacesLogs, action.workspacesLogs),
      });
    case 'DELETE_DEVWORKSPACE_LOGS':
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
      type: 'UPDATE_DEVWORKSPACE_LOGS',
      workspacesLogs,
    });
    status = DevWorkspaceStatus.FAILED;
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
          type: 'UPDATE_DEVWORKSPACE_LOGS',
          workspacesLogs,
        });
      }
    }
    status = statusUpdate.status;
  }
  if (status && status !== devWorkspaceStatusMap.get(workspace.status.devworkspaceId)) {
    devWorkspaceStatusMap.set(workspace.status.devworkspaceId, status);
    dispatch({
      type: 'UPDATE_DEVWORKSPACE_STATUS',
      workspaceId: workspace.status.devworkspaceId,
      status,
    });
  }
}
