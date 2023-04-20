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

import common, { api, ApplicationId } from '@eclipse-che/common';
import { Action, Reducer } from 'redux';
import { AppThunk } from '../..';
import { container } from '../../../inversify.config';
import { injectKubeConfig } from '../../../services/dashboard-backend-client/devWorkspaceApi';
import { WebsocketClient } from '../../../services/dashboard-backend-client/websocketClient';
import devfileApi, { isDevWorkspace } from '../../../services/devfileApi';
import { devWorkspaceKind } from '../../../services/devfileApi/devWorkspace';
import {
  DEVWORKSPACE_CHE_EDITOR,
  DEVWORKSPACE_UPDATING_TIMESTAMP_ANNOTATION,
} from '../../../services/devfileApi/devWorkspace/metadata';
import { getDefer, IDeferred } from '../../../services/helpers/deferred';
import { delay } from '../../../services/helpers/delay';
import { DisposableCollection } from '../../../services/helpers/disposable';
import { getNewerResourceVersion } from '../../../services/helpers/resourceVersion';
import { DevWorkspaceStatus } from '../../../services/helpers/types';
import { WorkspaceAdapter } from '../../../services/workspace-adapter';
import {
  DevWorkspaceClient,
  DEVWORKSPACE_NEXT_START_ANNOTATION,
} from '../../../services/workspace-client/devworkspace/devWorkspaceClient';
import { createObject } from '../../helpers';
import { selectDefaultNamespace } from '../../InfrastructureNamespaces/selectors';
import { getCustomEditor } from '../../../services/workspace-client/helpers';
import { AUTHORIZED, SanityCheckAction } from '../../sanityCheckMiddleware';
import * as DwServerConfigStore from '../../ServerConfig';
import { selectOpenVSXUrl } from '../../ServerConfig/selectors';
import { fetchResources } from '../../../services/dashboard-backend-client/devworkspaceResourcesApi';
import { dump } from 'js-yaml';
import { loadResourcesContent } from '../../../services/registry/resources';
import { checkRunningWorkspacesLimit } from './checkRunningWorkspacesLimit';
import { selectDevWorkspacesResourceVersion } from './selectors';
import OAuthService from '../../../services/oauth';
import { EDITOR_ATTR } from '../../../containers/Loader/const';
import { FactoryParams } from '../../../containers/Loader/buildFactoryParams';
import { getEditor } from '../../DevfileRegistries/getEditor';
import { selectApplications } from '../../ClusterInfo/selectors';

export const onStatusChangeCallbacks = new Map<string, (status: string) => void>();

export interface State {
  isLoading: boolean;
  workspaces: devfileApi.DevWorkspace[];
  resourceVersion: string;
  error?: string;
  startedWorkspaces: {
    [workspaceUID: string]: string;
  };
  warnings: {
    [workspaceUID: string]: string;
  };
}

export class RunningWorkspacesExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RunningWorkspacesExceededError';
  }
}

export enum Type {
  REQUEST_DEVWORKSPACE = 'REQUEST_DEVWORKSPACE',
  RECEIVE_DEVWORKSPACE_ERROR = 'RECEIVE_DEVWORKSPACE_ERROR',
  RECEIVE_DEVWORKSPACE = 'RECEIVE_DEVWORKSPACE',
  UPDATE_DEVWORKSPACE = 'UPDATE_DEVWORKSPACE',
  DELETE_DEVWORKSPACE = 'DELETE_DEVWORKSPACE',
  TERMINATE_DEVWORKSPACE = 'TERMINATE_DEVWORKSPACE',
  ADD_DEVWORKSPACE = 'ADD_DEVWORKSPACE',
  UPDATE_STARTED_WORKSPACES = 'UPDATE_STARTED_WORKSPACES',
  UPDATE_WARNING = 'UPDATE_WARNING',
}

export interface RequestDevWorkspacesAction extends Action, SanityCheckAction {
  type: Type.REQUEST_DEVWORKSPACE;
}

export interface ReceiveErrorAction extends Action {
  type: Type.RECEIVE_DEVWORKSPACE_ERROR;
  error: string;
}

export interface ReceiveWorkspacesAction extends Action {
  type: Type.RECEIVE_DEVWORKSPACE;
  workspaces: devfileApi.DevWorkspace[];
  resourceVersion: string;
}

export interface UpdateWorkspaceAction extends Action {
  type: Type.UPDATE_DEVWORKSPACE;
  workspace: devfileApi.DevWorkspace;
}

export interface DeleteWorkspaceAction extends Action {
  type: Type.DELETE_DEVWORKSPACE;
  workspace: devfileApi.DevWorkspace;
}

export interface TerminateWorkspaceAction extends Action {
  type: Type.TERMINATE_DEVWORKSPACE;
  workspaceUID: string;
  message: string;
}

export interface AddWorkspaceAction extends Action {
  type: Type.ADD_DEVWORKSPACE;
  workspace: devfileApi.DevWorkspace;
}

export interface UpdateStartedWorkspaceAction extends Action {
  type: Type.UPDATE_STARTED_WORKSPACES;
  workspaces: devfileApi.DevWorkspace[];
}

export interface UpdateWarningAction extends Action {
  type: Type.UPDATE_WARNING;
  workspace: devfileApi.DevWorkspace;
  warning: string;
}

export type KnownAction =
  | RequestDevWorkspacesAction
  | ReceiveErrorAction
  | ReceiveWorkspacesAction
  | UpdateWorkspaceAction
  | DeleteWorkspaceAction
  | TerminateWorkspaceAction
  | AddWorkspaceAction
  | UpdateStartedWorkspaceAction
  | UpdateWarningAction;

export type ResourceQueryParams = {
  'debug-workspace-start': boolean;
  [propName: string]: string | boolean | undefined;
};
export type ActionCreators = {
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
    attributes: Partial<FactoryParams>,
    optionalFilesContent: {
      [fileName: string]: string;
    },
  ) => AppThunk<KnownAction, Promise<void>>;
  createWorkspaceFromResources: (
    devWorkspace: devfileApi.DevWorkspace,
    devWorkspaceTemplate: devfileApi.DevWorkspaceTemplate,
    editorId?: string,
  ) => AppThunk<KnownAction, Promise<void>>;

  handleWebSocketMessage: (
    message: api.webSocket.NotificationMessage,
  ) => AppThunk<KnownAction, Promise<void>>;
};
export const actionCreators: ActionCreators = {
  requestWorkspaces:
    (): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      await dispatch({ type: Type.REQUEST_DEVWORKSPACE, check: AUTHORIZED });

      try {
        const defaultKubernetesNamespace = selectDefaultNamespace(getState());
        const defaultNamespace = defaultKubernetesNamespace.name;
        const { workspaces, resourceVersion } = defaultNamespace
          ? await getDevWorkspaceClient().getAllWorkspaces(defaultNamespace)
          : {
              workspaces: [],
              resourceVersion: '',
            };

        dispatch({
          type: Type.RECEIVE_DEVWORKSPACE,
          workspaces,
          resourceVersion,
        });
        dispatch({
          type: Type.UPDATE_STARTED_WORKSPACES,
          workspaces,
        });

        const promises = workspaces
          .filter(
            workspace =>
              workspace.metadata.annotations?.[DEVWORKSPACE_UPDATING_TIMESTAMP_ANNOTATION] ===
              undefined,
          )
          .map(async workspace => {
            // this will set updating timestamp to annotations and update the workspace
            await dispatch(actionCreators.updateWorkspace(workspace));
          });
        await Promise.allSettled(promises);
      } catch (e) {
        const errorMessage =
          'Failed to fetch available workspaces, reason: ' + common.helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_DEVWORKSPACE_ERROR,
          error: errorMessage,
        });
        throw errorMessage;
      }
    },

  requestWorkspace:
    (workspace: devfileApi.DevWorkspace): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      await dispatch({ type: Type.REQUEST_DEVWORKSPACE, check: AUTHORIZED });

      try {
        const namespace = workspace.metadata.namespace;
        const name = workspace.metadata.name;
        const update = await getDevWorkspaceClient().getWorkspaceByName(namespace, name);
        dispatch({
          type: Type.UPDATE_DEVWORKSPACE,
          workspace: update,
        });

        if (
          update.metadata.annotations?.[DEVWORKSPACE_UPDATING_TIMESTAMP_ANNOTATION] === undefined
        ) {
          // this will set updating timestamp to annotations and update the workspace
          await dispatch(actionCreators.updateWorkspace(update));
        }
      } catch (e) {
        const errorMessage =
          `Failed to fetch the workspace ${workspace.metadata.name}, reason: ` +
          common.helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_DEVWORKSPACE_ERROR,
          error: errorMessage,
        });
        throw errorMessage;
      }
    },

  startWorkspace:
    (
      _workspace: devfileApi.DevWorkspace,
      debugWorkspace = false,
    ): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      let workspace = getState().devWorkspaces.workspaces.find(
        w => w.metadata.uid === _workspace.metadata.uid,
      );
      if (workspace === undefined) {
        console.warn(`Can't find the target workspace ${_workspace.metadata.name}`);
        return;
      }
      if (workspace.spec.started) {
        console.warn(`Workspace ${_workspace.metadata.name} already started`);
        return;
      }
      await OAuthService.refreshTokenIfNeeded(workspace);
      await dispatch({ type: Type.REQUEST_DEVWORKSPACE, check: AUTHORIZED });
      try {
        checkRunningWorkspacesLimit(getState());

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
          workspace.spec.started = false;
          workspace = await getDevWorkspaceClient().update(workspace);
        }

        await dispatch(DwServerConfigStore.actionCreators.requestServerConfig());
        const config = getState().dwServerConfig.config;
        workspace = await getDevWorkspaceClient().managePvcStrategy(workspace, config);

        // inject or remove the container build attribute
        workspace = await getDevWorkspaceClient().manageContainerBuildAttribute(workspace, config);

        workspace = await getDevWorkspaceClient().manageDebugMode(workspace, debugWorkspace);

        const startingWorkspace = await getDevWorkspaceClient().changeWorkspaceStatus(
          workspace,
          true,
          true,
        );
        const editor = startingWorkspace.metadata.annotations
          ? startingWorkspace.metadata.annotations[DEVWORKSPACE_CHE_EDITOR]
          : undefined;
        const defaultPlugins = getState().dwPlugins.defaultPlugins;
        await getDevWorkspaceClient().onStart(startingWorkspace, defaultPlugins, editor);
        dispatch({
          type: Type.UPDATE_DEVWORKSPACE,
          workspace: startingWorkspace,
        });

        // sometimes workspace don't have enough time to change its status.
        // wait for status to become STARTING or 10 seconds, whichever comes first
        const defer: IDeferred<void> = getDefer();
        const toDispose = new DisposableCollection();
        const statusStartingHandler = async (status: string) => {
          if (status === DevWorkspaceStatus.STARTING) {
            defer.resolve();
          }
        };
        const workspaceUID = WorkspaceAdapter.getUID(workspace);
        onStatusChangeCallbacks.set(workspaceUID, statusStartingHandler);
        toDispose.push({
          dispose: () => onStatusChangeCallbacks.delete(workspaceUID),
        });
        const startingTimeout = 10000;
        await Promise.race([defer.promise, delay(startingTimeout)]);
        toDispose.dispose();

        getDevWorkspaceClient().checkForDevWorkspaceError(startingWorkspace);
      } catch (e) {
        const errorMessage =
          `Failed to start the workspace ${workspace.metadata.name}, reason: ` +
          common.helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_DEVWORKSPACE_ERROR,
          error: errorMessage,
        });

        if (common.helpers.errors.isError(e)) {
          throw e;
        }
        throw new Error(errorMessage);
      }
    },

  restartWorkspace:
    (workspace: devfileApi.DevWorkspace): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      const defer: IDeferred<void> = getDefer();
      const toDispose = new DisposableCollection();
      const onStatusChangeCallback = async (status: string) => {
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
        await getDevWorkspaceClient().changeWorkspaceStatus(workspace, false);
      } catch (e) {
        const errorMessage =
          `Failed to stop the workspace ${workspace.metadata.name}, reason: ` +
          common.helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_DEVWORKSPACE_ERROR,
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
        await getDevWorkspaceClient().delete(namespace, name);
        const workspaceUID = WorkspaceAdapter.getUID(workspace);
        dispatch({
          type: Type.TERMINATE_DEVWORKSPACE,
          workspaceUID,
          message: workspace.status?.message || 'Cleaning up resources for deletion',
        });
      } catch (e) {
        const resMessage =
          `Failed to delete the workspace ${workspace.metadata.name}, reason: ` +
          common.helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_DEVWORKSPACE_ERROR,
          error: resMessage,
        });

        throw resMessage;
      }
    },

  updateWorkspaceAnnotation:
    (workspace: devfileApi.DevWorkspace): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      await dispatch({ type: Type.REQUEST_DEVWORKSPACE, check: AUTHORIZED });

      try {
        const updated = await getDevWorkspaceClient().updateAnnotation(workspace);
        dispatch({
          type: Type.UPDATE_DEVWORKSPACE,
          workspace: updated,
        });
      } catch (e) {
        const errorMessage =
          `Failed to update the workspace ${workspace.metadata.name}, reason: ` +
          common.helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_DEVWORKSPACE_ERROR,
          error: errorMessage,
        });
        throw errorMessage;
      }
    },

  updateWorkspace:
    (workspace: devfileApi.DevWorkspace): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch): Promise<void> => {
      await dispatch({ type: Type.REQUEST_DEVWORKSPACE, check: AUTHORIZED });

      try {
        const updated = await getDevWorkspaceClient().update(workspace);
        dispatch({
          type: Type.UPDATE_DEVWORKSPACE,
          workspace: updated,
        });
      } catch (e) {
        const errorMessage =
          `Failed to update the workspace ${workspace.metadata.name}, reason: ` +
          common.helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_DEVWORKSPACE_ERROR,
          error: errorMessage,
        });
        throw errorMessage;
      }
    },

  createWorkspaceFromResources:
    (
      devWorkspaceResource: devfileApi.DevWorkspace,
      devWorkspaceTemplateResource: devfileApi.DevWorkspaceTemplate,
      editorId?: string,
    ): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      const state = getState();

      await dispatch({ type: Type.REQUEST_DEVWORKSPACE, check: AUTHORIZED });

      const defaultKubernetesNamespace = selectDefaultNamespace(state);
      const openVSXUrl = selectOpenVSXUrl(state);
      const defaultNamespace = defaultKubernetesNamespace.name;
      try {
        const cheEditor = editorId ? editorId : devWorkspaceTemplateResource.metadata.name;
        const pluginRegistryUrl =
          state.workspacesSettings.settings['cheWorkspacePluginRegistryUrl'];
        const pluginRegistryInternalUrl =
          state.workspacesSettings.settings['cheWorkspacePluginRegistryInternalUrl'];

        /* create a new DevWorkspace (without components) */

        const createResp = await getDevWorkspaceClient().createDevWorkspace(
          defaultNamespace,
          devWorkspaceResource,
          cheEditor,
        );

        if (createResp.headers.warning) {
          // get rid of the status code
          const warning = createResp.headers.warning.replace(/^\d+\s*?-\s*?/g, '');

          dispatch({
            type: Type.UPDATE_WARNING,
            workspace: createResp.devWorkspace,
            warning,
          });
        }

        const clusterConsole = selectApplications(state).find(
          app => app.id === ApplicationId.CLUSTER_CONSOLE,
        );

        /* create a new DevWorkspaceTemplate */
        await getDevWorkspaceClient().createDevWorkspaceTemplate(
          defaultNamespace,
          createResp.devWorkspace,
          devWorkspaceTemplateResource,
          pluginRegistryUrl,
          pluginRegistryInternalUrl,
          openVSXUrl,
          clusterConsole,
        );

        /* update the DevWorkspace with components */

        const updateResp = await getDevWorkspaceClient().updateDevWorkspace(
          createResp.devWorkspace,
          pluginRegistryUrl,
          pluginRegistryInternalUrl,
          openVSXUrl,
          clusterConsole,
        );

        if (updateResp.headers.warning) {
          dispatch({
            type: Type.UPDATE_WARNING,
            workspace: updateResp.devWorkspace,
            warning: updateResp.headers.warning,
          });
        }

        dispatch({
          type: Type.ADD_DEVWORKSPACE,
          workspace: updateResp.devWorkspace,
        });
      } catch (e) {
        const errorMessage =
          'Failed to create a new workspace, reason: ' + common.helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_DEVWORKSPACE_ERROR,
          error: errorMessage,
        });
        throw errorMessage;
      }
    },

  createWorkspaceFromDevfile:
    (
      devfile: devfileApi.Devfile,
      attributes: Partial<FactoryParams>,
      optionalFilesContent: {
        [fileName: string]: string;
      },
    ): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      const state = getState();

      await dispatch({ type: Type.REQUEST_DEVWORKSPACE, check: AUTHORIZED });

      const pluginRegistryUrl = state.workspacesSettings.settings['cheWorkspacePluginRegistryUrl'];
      let devWorkspaceResource: devfileApi.DevWorkspace;
      let devWorkspaceTemplateResource: devfileApi.DevWorkspaceTemplate;
      let editorContent: string | undefined;
      // do we have an optional editor parameter ?
      if (attributes[EDITOR_ATTR]) {
        const response = await getEditor(
          attributes[EDITOR_ATTR],
          dispatch,
          getState,
          pluginRegistryUrl,
        );
        if (response.content) {
          editorContent = response.content;
        } else {
          throw new Error(response.error);
        }
      } else {
        // do we have the custom editor in `.che/che-editor.yaml` ?
        editorContent = await getCustomEditor(
          pluginRegistryUrl,
          optionalFilesContent,
          dispatch,
          getState,
        );
        if (!editorContent) {
          const defaultsEditor = state.dwServerConfig.config.defaults.editor;
          if (!defaultsEditor) {
            throw new Error('Cannot define default editor');
          }
          const response = await getEditor(defaultsEditor, dispatch, getState, pluginRegistryUrl);
          if (response.content) {
            editorContent = response.content;
          } else {
            throw new Error(response.error);
          }
          console.debug(`Using default editor ${defaultsEditor}`);
        }
      }

      try {
        const resourcesContent = await fetchResources({
          pluginRegistryUrl,
          devfileContent: dump(devfile),
          editorPath: undefined,
          editorId: undefined,
          editorContent,
        });
        const resources = loadResourcesContent(resourcesContent);
        devWorkspaceResource = resources.find(
          resource => resource.kind === 'DevWorkspace',
        ) as devfileApi.DevWorkspace;
        if (devWorkspaceResource === undefined) {
          throw new Error('Failed to find a DevWorkspace in the fetched resources.');
        }

        devWorkspaceTemplateResource = resources.find(
          resource => resource.kind === 'DevWorkspaceTemplate',
        ) as devfileApi.DevWorkspaceTemplate;
        if (devWorkspaceTemplateResource === undefined) {
          throw new Error('Failed to find a DevWorkspaceTemplate in the fetched resources.');
        }
      } catch (e) {
        const errorMessage = common.helpers.errors.getMessage(e);
        dispatch({
          type: Type.RECEIVE_DEVWORKSPACE_ERROR,
          error: errorMessage,
        });
        throw errorMessage;
      }

      await dispatch(
        actionCreators.createWorkspaceFromResources(
          devWorkspaceResource,
          devWorkspaceTemplateResource,
          attributes[EDITOR_ATTR],
        ),
      );
    },

  handleWebSocketMessage:
    (message: api.webSocket.NotificationMessage): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      if (api.webSocket.isStatusMessage(message)) {
        const { status } = message;

        const errorMessage = `WebSocket(DEV_WORKSPACE): status code ${status.code}, reason: ${status.message}`;
        console.warn(errorMessage);

        if (status.code !== 200) {
          /* in case of error status trying to fetch all devWorkspaces and re-subscribe to websocket channel */

          const websocketClient = container.get(WebsocketClient);

          websocketClient.unsubscribeFromChannel(api.webSocket.Channel.DEV_WORKSPACE);

          await dispatch(actionCreators.requestWorkspaces());

          const defaultKubernetesNamespace = selectDefaultNamespace(getState());
          const namespace = defaultKubernetesNamespace.name;
          const getResourceVersion = () => {
            const state = getState();
            return selectDevWorkspacesResourceVersion(state);
          };
          websocketClient.subscribeToChannel(api.webSocket.Channel.DEV_WORKSPACE, namespace, {
            getResourceVersion,
          });
        }
        return;
      }

      if (api.webSocket.isDevWorkspaceMessage(message)) {
        const { eventPhase, devWorkspace } = message;

        if (isDevWorkspace(devWorkspace) === false) {
          return;
        }

        const workspace = devWorkspace as devfileApi.DevWorkspace;

        // previous state of the workspace is needed for notifying about workspace status changes.
        const prevWorkspace = getState().devWorkspaces.workspaces.find(
          w => WorkspaceAdapter.getId(w) === WorkspaceAdapter.getId(workspace),
        );

        // update the workspace in the store
        switch (eventPhase) {
          case api.webSocket.EventPhase.ADDED:
            dispatch({
              type: Type.ADD_DEVWORKSPACE,
              workspace,
            });
            break;
          case api.webSocket.EventPhase.MODIFIED:
            dispatch({
              type: Type.UPDATE_DEVWORKSPACE,
              workspace,
            });
            break;
          case api.webSocket.EventPhase.DELETED:
            dispatch({
              type: Type.DELETE_DEVWORKSPACE,
              workspace,
            });
            break;
          default:
            console.warn(`Unknown event phase in message: `, message);
        }
        dispatch({
          type: Type.UPDATE_STARTED_WORKSPACES,
          workspaces: [workspace],
        });

        // notify about workspace status changes
        const devworkspaceId = workspace.status?.devworkspaceId;
        const phase = workspace.status?.phase;
        const prevPhase = prevWorkspace?.status?.phase;
        const workspaceUID = WorkspaceAdapter.getUID(workspace);
        if (phase && prevPhase !== phase) {
          const onStatusChangeListener = onStatusChangeCallbacks.get(workspaceUID);

          if (onStatusChangeListener) {
            onStatusChangeListener(phase);
          }
        }

        // inject the kube config
        if (
          phase === DevWorkspaceStatus.RUNNING &&
          phase !== prevPhase &&
          devworkspaceId !== undefined
        ) {
          try {
            await injectKubeConfig(workspace.metadata.namespace, devworkspaceId);
          } catch (e) {
            console.error(e);
          }
        }
      }
    },
};

const unloadedState: State = {
  workspaces: [],
  isLoading: false,
  resourceVersion: '0',
  startedWorkspaces: {},
  warnings: {},
};

export const reducer: Reducer<State> = (
  state: State | undefined,
  incomingAction: Action,
): State => {
  if (state === undefined) {
    return unloadedState;
  }

  const action = incomingAction as KnownAction;
  switch (action.type) {
    case Type.REQUEST_DEVWORKSPACE:
      return createObject(state, {
        isLoading: true,
        error: undefined,
      });
    case Type.RECEIVE_DEVWORKSPACE:
      return createObject(state, {
        isLoading: false,
        workspaces: action.workspaces,
        resourceVersion: getNewerResourceVersion(action.resourceVersion, state.resourceVersion),
      });
    case Type.RECEIVE_DEVWORKSPACE_ERROR:
      return createObject(state, {
        isLoading: false,
        error: action.error,
      });
    case Type.UPDATE_DEVWORKSPACE:
      return createObject(state, {
        isLoading: false,
        workspaces: state.workspaces.map(workspace =>
          WorkspaceAdapter.getUID(workspace) === WorkspaceAdapter.getUID(action.workspace)
            ? action.workspace
            : workspace,
        ),
        resourceVersion: getNewerResourceVersion(
          action.workspace.metadata.resourceVersion,
          state.resourceVersion,
        ),
      });
    case Type.ADD_DEVWORKSPACE:
      return createObject(state, {
        isLoading: false,
        workspaces: state.workspaces
          .filter(
            workspace =>
              WorkspaceAdapter.getUID(workspace) !== WorkspaceAdapter.getUID(action.workspace),
          )
          .concat([action.workspace]),
        resourceVersion: getNewerResourceVersion(
          action.workspace.metadata.resourceVersion,
          state.resourceVersion,
        ),
      });
    case Type.TERMINATE_DEVWORKSPACE:
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
    case Type.DELETE_DEVWORKSPACE:
      return createObject(state, {
        isLoading: false,
        workspaces: state.workspaces.filter(
          workspace =>
            WorkspaceAdapter.getUID(workspace) !== WorkspaceAdapter.getUID(action.workspace),
        ),
        resourceVersion: getNewerResourceVersion(
          action.workspace.metadata.resourceVersion,
          state.resourceVersion,
        ),
      });
    case Type.UPDATE_STARTED_WORKSPACES:
      return createObject(state, {
        startedWorkspaces: action.workspaces.reduce((acc, workspace) => {
          if (workspace.spec.started === false) {
            delete acc[WorkspaceAdapter.getUID(workspace)];
            return acc;
          }

          // workspace.spec.started === true
          if (acc[WorkspaceAdapter.getUID(workspace)] !== undefined) {
            // do nothing
            return acc;
          }

          if (workspace.metadata.resourceVersion === undefined) {
            // do nothing
            return acc;
          }

          acc[WorkspaceAdapter.getUID(workspace)] = workspace.metadata.resourceVersion;
          return acc;
        }, state.startedWorkspaces),
      });
    case Type.UPDATE_WARNING:
      return createObject(state, {
        warnings: {
          [WorkspaceAdapter.getUID(action.workspace)]: action.warning,
        },
      });
    default:
      return state;
  }
};

// This function was added to make it easier to mock the DevWorkspaceClient in tests
export function getDevWorkspaceClient(): DevWorkspaceClient {
  return container.get(DevWorkspaceClient);
}
