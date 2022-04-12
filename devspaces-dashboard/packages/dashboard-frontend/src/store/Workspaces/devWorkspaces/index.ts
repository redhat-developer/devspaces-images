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
import common from '@eclipse-che/common';
import { AppThunk } from '../..';
import { container } from '../../../inversify.config';
import { DevWorkspaceStatus } from '../../../services/helpers/types';
import { createObject } from '../../helpers';
import {
  DevWorkspaceClient,
  DEVWORKSPACE_NEXT_START_ANNOTATION,
  IStatusUpdate,
} from '../../../services/workspace-client/devworkspace/devWorkspaceClient';
import devfileApi, { isDevWorkspace } from '../../../services/devfileApi';
import { deleteLogs, mergeLogs } from '../logs';
import { getDefer, IDeferred } from '../../../services/helpers/deferred';
import { DisposableCollection } from '../../../services/helpers/disposable';
import { selectDwEditorsPluginsList } from '../../Plugins/devWorkspacePlugins/selectors';
import { devWorkspaceKind } from '../../../services/devfileApi/devWorkspace';
import { WorkspaceAdapter } from '../../../services/workspace-adapter';
import {
  DEVWORKSPACE_CHE_EDITOR,
  DEVWORKSPACE_UPDATING_TIMESTAMP_ANNOTATION,
} from '../../../services/devfileApi/devWorkspace/metadata';
import * as DwPluginsStore from '../../Plugins/devWorkspacePlugins';
import { selectDefaultNamespace } from '../../InfrastructureNamespaces/selectors';
import { injectKubeConfig } from '../../../services/dashboard-backend-client/devWorkspaceApi';
import { selectRunningWorkspacesLimit } from '../../ClusterConfig/selectors';
const devWorkspaceClient = container.get(DevWorkspaceClient);

export const onStatusChangeCallbacks = new Map<string, (status: DevWorkspaceStatus) => void>();

export interface State {
  isLoading: boolean;
  workspaces: devfileApi.DevWorkspace[];
  resourceVersion?: string;
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
  workspaces: devfileApi.DevWorkspace[];
  resourceVersion: string;
}

interface UpdateWorkspaceAction extends Action {
  type: 'UPDATE_DEVWORKSPACE';
  workspace: devfileApi.DevWorkspace;
}

interface UpdateWorkspaceStatusAction extends Action {
  type: 'UPDATE_DEVWORKSPACE_STATUS';
  workspaceUID: string;
  status: string;
  message: string;
}

interface UpdateWorkspacesLogsAction extends Action {
  type: 'UPDATE_DEVWORKSPACE_LOGS';
  workspacesLogs: Map<string, string[]>;
}

interface DeleteWorkspaceLogsAction extends Action {
  type: 'DELETE_DEVWORKSPACE_LOGS';
  workspaceUID: string;
}

interface DeleteWorkspaceAction extends Action {
  type: 'DELETE_DEVWORKSPACE';
  workspaceId: string;
}

interface TerminateWorkspaceAction extends Action {
  type: 'TERMINATE_DEVWORKSPACE';
  workspaceUID: string;
  message: string;
}

interface AddWorkspaceAction extends Action {
  type: 'ADD_DEVWORKSPACE';
  workspace: devfileApi.DevWorkspace;
}

type KnownAction =
  | RequestDevWorkspacesAction
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
};
export type ActionCreators = {
  updateAddedDevWorkspaces: (workspace: devfileApi.DevWorkspace[]) => AppThunk<KnownAction>;
  updateDeletedDevWorkspaces: (deletedWorkspacesIds: string[]) => AppThunk<KnownAction>;
  updateDevWorkspaceStatus: (message: IStatusUpdate) => AppThunk<KnownAction>;
  requestWorkspaces: () => AppThunk<KnownAction, Promise<void>>;
  requestWorkspace: (workspace: devfileApi.DevWorkspace) => AppThunk<KnownAction, Promise<void>>;
  startWorkspace: (
    workspace: devfileApi.DevWorkspace,
    debugWorkspace?: boolean,
  ) => AppThunk<KnownAction, Promise<void>>;
  restartWorkspace: (workspace: devfileApi.DevWorkspace) => AppThunk<KnownAction, Promise<void>>;
  stopWorkspace: (workspace: devfileApi.DevWorkspace) => AppThunk<KnownAction, Promise<void>>;
  terminateWorkspace: (workspace: devfileApi.DevWorkspace) => AppThunk<KnownAction, Promise<void>>;
  updateWorkspaceAnnotation: (
    workspace: devfileApi.DevWorkspace,
  ) => AppThunk<KnownAction, Promise<void>>;
  updateWorkspace: (workspace: devfileApi.DevWorkspace) => AppThunk<KnownAction, Promise<void>>;
  createWorkspaceFromDevfile: (
    devfile: devfileApi.Devfile,
    optionalFilesContent: {
      [fileName: string]: string;
    },
    pluginRegistryUrl: string | undefined,
    pluginRegistryInternalUrl: string | undefined,
    attributes: { [key: string]: string },
    start?: boolean,
  ) => AppThunk<KnownAction, Promise<void>>;
  createWorkspaceFromResources: (
    devworkspace: devfileApi.DevWorkspace,
    devworkspaceTemplate: devfileApi.DevWorkspaceTemplate,
    editor?: string,
  ) => AppThunk<KnownAction, Promise<void>>;

  deleteWorkspaceLogs: (workspaceUID: string) => AppThunk<DeleteWorkspaceLogsAction, void>;
};
export const actionCreators: ActionCreators = {
  updateAddedDevWorkspaces:
    (workspaces: devfileApi.DevWorkspace[]): AppThunk<KnownAction, void> =>
    (dispatch): void => {
      workspaces.forEach(workspace => {
        dispatch({
          type: 'ADD_DEVWORKSPACE',
          workspace,
        });
      });
    },

  updateDeletedDevWorkspaces:
    (deletedWorkspacesIds: string[]): AppThunk<KnownAction, void> =>
    (dispatch): void => {
      deletedWorkspacesIds.forEach(workspaceId => {
        dispatch({
          type: 'DELETE_DEVWORKSPACE',
          workspaceId,
        });
      });
    },

  updateDevWorkspaceStatus:
    (message: IStatusUpdate): AppThunk<KnownAction, void> =>
    (dispatch): void => {
      onStatusUpdateReceived(dispatch, message);
    },

  requestWorkspaces:
    (): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      dispatch({ type: 'REQUEST_DEVWORKSPACE' });

      try {
        const defaultKubernetesNamespace = selectDefaultNamespace(getState());
        const defaultNamespace = defaultKubernetesNamespace.name;
        const { workspaces, resourceVersion } = await devWorkspaceClient.getAllWorkspaces(
          defaultNamespace,
        );

        dispatch({
          type: 'RECEIVE_DEVWORKSPACE',
          workspaces,
          resourceVersion,
        });

        const promises = workspaces
          .filter(
            workspace =>
              workspace.metadata.annotations?.[DEVWORKSPACE_UPDATING_TIMESTAMP_ANNOTATION] ===
              undefined,
          )
          .map(async workspace => {
            // this will set updating timestamp to annotations and update the workspace
            await actionCreators.updateWorkspace(workspace)(dispatch, getState, undefined);
          });
        await Promise.allSettled(promises);
      } catch (e) {
        const errorMessage =
          'Failed to fetch available workspaces, reason: ' + common.helpers.errors.getMessage(e);
        dispatch({
          type: 'RECEIVE_DEVWORKSPACE_ERROR',
          error: errorMessage,
        });
        throw errorMessage;
      }
    },

  requestWorkspace:
    (workspace: devfileApi.DevWorkspace): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      dispatch({ type: 'REQUEST_DEVWORKSPACE' });

      try {
        const namespace = workspace.metadata.namespace;
        const name = workspace.metadata.name;
        const update = await devWorkspaceClient.getWorkspaceByName(namespace, name);
        dispatch({
          type: 'UPDATE_DEVWORKSPACE',
          workspace: update,
        });

        if (
          update.metadata.annotations?.[DEVWORKSPACE_UPDATING_TIMESTAMP_ANNOTATION] === undefined
        ) {
          // this will set updating timestamp to annotations and update the workspace
          await actionCreators.updateWorkspace(update)(dispatch, getState, undefined);
        }
      } catch (e) {
        const errorMessage =
          `Failed to fetch the workspace ${workspace.metadata.name}, reason: ` +
          common.helpers.errors.getMessage(e);
        dispatch({
          type: 'RECEIVE_DEVWORKSPACE_ERROR',
          error: errorMessage,
        });
        throw errorMessage;
      }
    },

  startWorkspace:
    (
      workspace: devfileApi.DevWorkspace,
      debugWorkspace = false,
    ): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      dispatch({ type: 'REQUEST_DEVWORKSPACE' });
      try {
        const { workspaces } = await devWorkspaceClient.getAllWorkspaces(
          workspace.metadata.namespace,
        );
        const runningWorkspaces = workspaces.filter(workspace => workspace.spec.started === true);
        const runningLimit = selectRunningWorkspacesLimit(getState());
        if (runningWorkspaces.length >= runningLimit) {
          throw new Error('You are not allowed to start more workspaces.');
        }
        await devWorkspaceClient.updateDebugMode(workspace, debugWorkspace);
        let updatedWorkspace: devfileApi.DevWorkspace;
        await addKubeConfigInjection(workspace);
        if (workspace.metadata.annotations?.[DEVWORKSPACE_NEXT_START_ANNOTATION]) {
          const storedDevWorkspace = JSON.parse(
            workspace.metadata.annotations[DEVWORKSPACE_NEXT_START_ANNOTATION],
          ) as unknown;
          if (!isDevWorkspace(storedDevWorkspace)) {
            console.error(
              `The stored devworkspace either has wrong "kind" (not ${devWorkspaceKind}) or lacks some of mandatory fields: `,
              storedDevWorkspace,
            );
            throw new Error(
              'Unexpected error happened. Please check the Console tab of Developer tools.',
            );
          }

          delete workspace.metadata.annotations[DEVWORKSPACE_NEXT_START_ANNOTATION];
          workspace.spec.template = storedDevWorkspace.spec.template;
          workspace.spec.started = true;
          updatedWorkspace = await devWorkspaceClient.update(workspace);
        } else {
          updatedWorkspace = await devWorkspaceClient.changeWorkspaceStatus(workspace, true, true);
        }
        const editor = updatedWorkspace.metadata.annotations
          ? updatedWorkspace.metadata.annotations[DEVWORKSPACE_CHE_EDITOR]
          : undefined;
        const defaultPlugins = getState().dwPlugins.defaultPlugins;
        await devWorkspaceClient.onStart(updatedWorkspace, defaultPlugins, editor);
        dispatch({
          type: 'UPDATE_DEVWORKSPACE',
          workspace: updatedWorkspace,
        });
        const workspaceUID = workspace.metadata.uid;
        dispatch({
          type: 'DELETE_DEVWORKSPACE_LOGS',
          workspaceUID,
        });
        devWorkspaceClient.checkForDevWorkspaceError(updatedWorkspace);
      } catch (e) {
        const errorMessage =
          `Failed to start the workspace ${workspace.metadata.name}, reason: ` +
          common.helpers.errors.getMessage(e);
        dispatch({
          type: 'RECEIVE_DEVWORKSPACE_ERROR',
          error: errorMessage,
        });
        throw errorMessage;
      }
    },

  restartWorkspace:
    (workspace: devfileApi.DevWorkspace): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      const defer: IDeferred<void> = getDefer();
      const toDispose = new DisposableCollection();
      const onStatusChangeCallback = async (status: DevWorkspaceStatus) => {
        if (status === DevWorkspaceStatus.STOPPED || status === DevWorkspaceStatus.FAILED) {
          toDispose.dispose();
          try {
            await dispatch(actionCreators.startWorkspace(workspace));
            defer.resolve();
          } catch (e) {
            defer.reject(`Failed to restart the workspace ${workspace.metadata.name}. ${e}`);
          }
        }
      };
      if (
        workspace.status?.phase === DevWorkspaceStatus.STOPPED ||
        workspace.status?.phase === DevWorkspaceStatus.FAILED
      ) {
        await onStatusChangeCallback(workspace.status.phase);
      } else {
        const workspaceUID = WorkspaceAdapter.getUID(workspace);
        onStatusChangeCallbacks.set(workspaceUID, onStatusChangeCallback);
        toDispose.push({
          dispose: () => onStatusChangeCallbacks.delete(workspaceUID),
        });
        if (
          workspace.status?.phase === DevWorkspaceStatus.RUNNING ||
          workspace.status?.phase === DevWorkspaceStatus.STARTING ||
          workspace.status?.phase === DevWorkspaceStatus.FAILING
        ) {
          try {
            await dispatch(actionCreators.stopWorkspace(workspace));
          } catch (e) {
            defer.reject(`Failed to restart the workspace ${workspace.metadata.name}. ${e}`);
          }
        }
      }

      return defer.promise;
    },

  stopWorkspace:
    (workspace: devfileApi.DevWorkspace): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      try {
        await devWorkspaceClient.changeWorkspaceStatus(workspace, false);
        dispatch({
          type: 'DELETE_DEVWORKSPACE_LOGS',
          workspaceUID: WorkspaceAdapter.getUID(workspace),
        });
      } catch (e) {
        const errorMessage =
          `Failed to stop the workspace ${workspace.metadata.name}, reason: ` +
          common.helpers.errors.getMessage(e);
        dispatch({
          type: 'RECEIVE_DEVWORKSPACE_ERROR',
          error: errorMessage,
        });
        throw errorMessage;
      }
    },

  terminateWorkspace:
    (workspace: devfileApi.DevWorkspace): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      try {
        const namespace = workspace.metadata.namespace;
        const name = workspace.metadata.name;
        await devWorkspaceClient.delete(namespace, name);
        const workspaceUID = WorkspaceAdapter.getUID(workspace);
        dispatch({
          type: 'TERMINATE_DEVWORKSPACE',
          workspaceUID,
          message: workspace.status?.message || 'Cleaning up resources for deletion',
        });
        dispatch({ type: 'DELETE_DEVWORKSPACE_LOGS', workspaceUID });
      } catch (e) {
        const resMessage =
          `Failed to delete the workspace ${workspace.metadata.name}, reason: ` +
          common.helpers.errors.getMessage(e);
        dispatch({
          type: 'RECEIVE_DEVWORKSPACE_ERROR',
          error: resMessage,
        });

        throw resMessage;
      }
    },

  updateWorkspaceAnnotation:
    (workspace: devfileApi.DevWorkspace): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      dispatch({ type: 'REQUEST_DEVWORKSPACE' });

      try {
        const updated = await devWorkspaceClient.updateAnnotation(workspace);
        dispatch({
          type: 'UPDATE_DEVWORKSPACE',
          workspace: updated,
        });
      } catch (e) {
        const errorMessage =
          `Failed to update the workspace ${workspace.metadata.name}, reason: ` +
          common.helpers.errors.getMessage(e);
        dispatch({
          type: 'RECEIVE_DEVWORKSPACE_ERROR',
          error: errorMessage,
        });
        throw errorMessage;
      }
    },

  updateWorkspace:
    (workspace: devfileApi.DevWorkspace): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      dispatch({ type: 'REQUEST_DEVWORKSPACE' });

      try {
        const updated = await devWorkspaceClient.update(workspace);
        dispatch({
          type: 'UPDATE_DEVWORKSPACE',
          workspace: updated,
        });
      } catch (e) {
        const errorMessage =
          `Failed to update the workspace ${workspace.metadata.name}, reason: ` +
          common.helpers.errors.getMessage(e);
        dispatch({
          type: 'RECEIVE_DEVWORKSPACE_ERROR',
          error: errorMessage,
        });
        throw errorMessage;
      }
    },

  createWorkspaceFromResources:
    (
      devworkspace: devfileApi.DevWorkspace,
      devworkspaceTemplate: devfileApi.DevWorkspaceTemplate,
      editorId?: string,
    ): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      const state = getState();
      const defaultKubernetesNamespace = selectDefaultNamespace(state);
      const defaultNamespace = defaultKubernetesNamespace.name;
      try {
        const cheEditor = editorId ? editorId : state.dwPlugins.defaultEditorName;
        const pluginRegistryUrl =
          state.workspacesSettings.settings['cheWorkspacePluginRegistryUrl'];
        const pluginRegistryInternalUrl =
          state.workspacesSettings.settings['cheWorkspacePluginRegistryInternalUrl'];
        const workspace = await devWorkspaceClient.createFromResources(
          defaultNamespace,
          devworkspace,
          devworkspaceTemplate,
          cheEditor,
          pluginRegistryUrl,
          pluginRegistryInternalUrl,
        );
        await addKubeConfigInjection(workspace);

        if (workspace.spec.started) {
          const editor = workspace.metadata.annotations
            ? workspace.metadata.annotations[DEVWORKSPACE_CHE_EDITOR]
            : undefined;
          const defaultPlugins = getState().dwPlugins.defaultPlugins;
          await devWorkspaceClient.onStart(workspace, defaultPlugins, editor);
        }
        dispatch({
          type: 'ADD_DEVWORKSPACE',
          workspace,
        });
      } catch (e) {
        const errorMessage =
          'Failed to create a new workspace from the devfile, reason: ' +
          common.helpers.errors.getMessage(e);
        dispatch({
          type: 'RECEIVE_DEVWORKSPACE_ERROR',
          error: errorMessage,
        });
        throw errorMessage;
      }
    },

  createWorkspaceFromDevfile:
    (
      devfile: devfileApi.Devfile,
      optionalFilesContent: {
        [fileName: string]: string;
      },
      pluginRegistryUrl: string | undefined,
      pluginRegistryInternalUrl: string | undefined,
      attributes: { [key: string]: string },
      start = true,
    ): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      let state = getState();

      // do we have an optional editor parameter ?
      let cheEditor: string | undefined = attributes?.['che-editor'];
      if (cheEditor) {
        // if the editor is different than the current default one, need to load a specific one
        if (cheEditor !== state.dwPlugins.defaultEditorName) {
          console.log(
            `User specified a different editor than the current default. Loading ${cheEditor} definition instead of ${state.dwPlugins.defaultEditorName}.`,
          );
          await dispatch(
            DwPluginsStore.actionCreators.requestDwEditor(
              state.workspacesSettings.settings,
              cheEditor,
            ),
          );
        }
      } else {
        // take the default editor name
        console.log(`Using default editor ${state.dwPlugins.defaultEditorName}`);
        cheEditor = state.dwPlugins.defaultEditorName;
      }

      if (state.dwPlugins.defaultEditorError) {
        throw `Required sources failed when trying to create the workspace: ${state.dwPlugins.defaultEditorError}`;
      }

      // refresh state
      state = getState();
      dispatch({ type: 'REQUEST_DEVWORKSPACE' });
      try {
        // If the devworkspace doesn't have a namespace then we assign it to the default kubernetesNamespace
        const devWorkspaceDevfile = devfile as devfileApi.Devfile;
        const defaultNamespace = selectDefaultNamespace(state);
        const dwEditorsList = selectDwEditorsPluginsList(cheEditor)(state);
        const workspace = await devWorkspaceClient.createFromDevfile(
          devWorkspaceDevfile,
          defaultNamespace.name,
          dwEditorsList,
          pluginRegistryUrl,
          pluginRegistryInternalUrl,
          cheEditor,
          optionalFilesContent,
          start,
        );
        await addKubeConfigInjection(workspace);

        if (workspace.spec.started) {
          const defaultPlugins = getState().dwPlugins.defaultPlugins;
          await devWorkspaceClient.onStart(workspace, defaultPlugins, cheEditor as string);
        }
        dispatch({
          type: 'ADD_DEVWORKSPACE',
          workspace,
        });
      } catch (e) {
        const errorMessage =
          'Failed to create a new workspace from the devfile, reason: ' +
          common.helpers.errors.getMessage(e);
        dispatch({
          type: 'RECEIVE_DEVWORKSPACE_ERROR',
          error: errorMessage,
        });
        throw errorMessage;
      }
    },

  deleteWorkspaceLogs:
    (workspaceUID: string): AppThunk<DeleteWorkspaceLogsAction, void> =>
    (dispatch): void => {
      dispatch({ type: 'DELETE_DEVWORKSPACE_LOGS', workspaceUID });
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
      return createObject(state, {
        isLoading: true,
        error: undefined,
      });
    case 'RECEIVE_DEVWORKSPACE':
      return createObject(state, {
        isLoading: false,
        workspaces: action.workspaces,
        resourceVersion: action.resourceVersion,
      });
    case 'RECEIVE_DEVWORKSPACE_ERROR':
      return createObject(state, {
        isLoading: false,
        error: action.error,
      });
    case 'UPDATE_DEVWORKSPACE':
      return createObject(state, {
        isLoading: false,
        workspaces: state.workspaces.map(workspace =>
          WorkspaceAdapter.getUID(workspace) === WorkspaceAdapter.getUID(action.workspace)
            ? action.workspace
            : workspace,
        ),
      });
    case 'UPDATE_DEVWORKSPACE_STATUS':
      return createObject(state, {
        workspaces: state.workspaces.map(workspace => {
          if (WorkspaceAdapter.getUID(workspace) === action.workspaceUID) {
            if (!workspace.status) {
              workspace.status = {} as devfileApi.DevWorkspaceStatus;
            }
            workspace.status.phase = action.status;
            workspace.status.message = action.message;
          }
          return workspace;
        }),
      });
    case 'ADD_DEVWORKSPACE':
      return createObject(state, {
        isLoading: false,
        workspaces: state.workspaces
          .filter(
            workspace =>
              WorkspaceAdapter.getUID(workspace) !== WorkspaceAdapter.getUID(action.workspace),
          )
          .concat([action.workspace]),
      });
    case 'TERMINATE_DEVWORKSPACE':
      return createObject(state, {
        isLoading: false,
        workspaces: state.workspaces.map(workspace => {
          if (WorkspaceAdapter.getUID(workspace) === action.workspaceUID) {
            const targetWorkspace = Object.assign({}, workspace);
            if (!targetWorkspace.status) {
              targetWorkspace.status = {} as devfileApi.DevWorkspaceStatus;
            }
            targetWorkspace.status.phase = DevWorkspaceStatus.TERMINATING;
            targetWorkspace.status.message = action.message;
            return targetWorkspace;
          }
          return workspace;
        }),
      });
    case 'DELETE_DEVWORKSPACE':
      return createObject(state, {
        workspaces: state.workspaces.filter(
          workspace => WorkspaceAdapter.getId(workspace) !== action.workspaceId,
        ),
      });
    case 'UPDATE_DEVWORKSPACE_LOGS':
      return createObject(state, {
        workspacesLogs: mergeLogs(state.workspacesLogs, action.workspacesLogs),
      });
    case 'DELETE_DEVWORKSPACE_LOGS':
      return createObject(state, {
        workspacesLogs: deleteLogs(state.workspacesLogs, action.workspaceUID),
      });
    default:
      return state;
  }
};

async function onStatusUpdateReceived(
  dispatch: ThunkDispatch<State, undefined, KnownAction>,
  statusUpdate: IStatusUpdate,
) {
  const { status } = statusUpdate;
  if (status !== statusUpdate.prevStatus) {
    dispatch({
      type: 'UPDATE_DEVWORKSPACE_STATUS',
      workspaceUID: statusUpdate.workspaceUID,
      message: statusUpdate.message,
      status,
    });
  }

  const callback = onStatusChangeCallbacks.get(statusUpdate.workspaceUID);

  if (callback && status) {
    callback(status);
  }

  if (statusUpdate.message) {
    if (statusUpdate.status !== DevWorkspaceStatus.STOPPED) {
      const workspacesLogs = new Map<string, string[]>();
      let message = statusUpdate.message;
      if (
        statusUpdate.status === DevWorkspaceStatus.FAILED ||
        statusUpdate.status === DevWorkspaceStatus.FAILING
      ) {
        message = `1 error occurred: ${message}`;
      }
      workspacesLogs.set(statusUpdate.workspaceUID, [message]);
      dispatch({
        type: 'UPDATE_DEVWORKSPACE_LOGS',
        workspacesLogs,
      });
    }
  }
}

export async function addKubeConfigInjection(workspace: devfileApi.DevWorkspace): Promise<void> {
  const toDispose = new DisposableCollection();
  const onStatusChangeCallback = async (status: string) => {
    if (status === DevWorkspaceStatus.RUNNING) {
      const workspaceId = WorkspaceAdapter.getId(workspace);
      try {
        await injectKubeConfig(workspace.metadata.namespace, workspaceId);
      } catch (e) {
        console.error(e);
      }
      toDispose.dispose();
    }
  };
  const workspaceUID = WorkspaceAdapter.getUID(workspace);
  onStatusChangeCallbacks.set(workspaceUID, onStatusChangeCallback);
  toDispose.push({
    dispose: () => onStatusChangeCallbacks.delete(workspaceUID),
  });
}
