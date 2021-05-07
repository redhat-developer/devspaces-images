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

import { inject, injectable } from 'inversify';
import { isDeleting, isWebTerminal } from '../helpers/devworkspace';
import { WorkspaceClient } from './';
import { RestApi as DevWorkspaceRestApi, IDevWorkspaceApi, IDevWorkspaceDevfile, IDevWorkspace, IDevWorkspaceTemplateApi, IDevWorkspaceTemplate, devWorkspaceApiGroup, devworkspaceSingularSubresource, devworkspaceVersion, ICheApi, Patch } from '@eclipse-che/devworkspace-client';
import { DevWorkspaceStatus, WorkspaceStatus } from '../helpers/types';
import { KeycloakSetupService } from '../keycloak/setup';
import { delay } from '../helpers/delay';
import { RestApi } from '@eclipse-che/devworkspace-client/dist/browser';
import { ThunkDispatch } from 'redux-thunk';
import { State } from '../../store/Workspaces/devWorkspaces';
import { Action } from 'redux';
import { AppState, AppThunk } from '../../store';

export interface IStatusUpdate {
  error?: string;
  message?: string;
  status?: string;
  prevStatus?: string;
  workspaceId: string;
}

export const DEVWORKSPACE_NEXT_START_ANNOTATION = 'che.eclipse.org/next-start-cfg';

/**
 * This class manages the connection between the frontend and the devworkspace typescript library
 */
@injectable()
export class DevWorkspaceClient extends WorkspaceClient {

  private dwApi: IDevWorkspaceApi;
  private dwtApi: IDevWorkspaceTemplateApi;
  private dwCheApi: ICheApi;
  private previousItems: Map<string, Map<string, IStatusUpdate>>;
  private client: RestApi;
  private maxStatusAttempts: number;
  private initializing: Promise<void>;
  private lastDevWorkspaceLog: Map<string, string>;

  constructor(@inject(KeycloakSetupService) keycloakSetupService: KeycloakSetupService) {
    super(keycloakSetupService);
    this.axios.defaults.baseURL = '/api/unsupported/k8s';
    this.client = new DevWorkspaceRestApi(this.axios);
    this.dwCheApi = this.client.cheApi;
    this.dwApi = this.client.devworkspaceApi;
    this.dwtApi = this.client.templateApi;
    this.previousItems = new Map();
    this.maxStatusAttempts = 10;
    this.lastDevWorkspaceLog = new Map();
  }

  isEnabled(): Promise<boolean> {
    return this.client.isDevWorkspaceApiEnabled();
  }

  async getAllWorkspaces(defaultNamespace: string): Promise<IDevWorkspace[]> {
    await this.initializing;
    const workspaces = await this.dwApi.listInNamespace(defaultNamespace);
    const availableWorkspaces: IDevWorkspace[] = [];
    for (const workspace of workspaces) {
      if (!isDeleting(workspace) && !isWebTerminal(workspace)) {
        availableWorkspaces.push(workspace);
      }
    }
    return availableWorkspaces;
  }

  async getWorkspaceByName(namespace: string, workspaceName: string): Promise<IDevWorkspace> {
    let workspace = await this.dwApi.getByName(namespace, workspaceName);
    let attempted = 0;
    while ((!workspace.status || !workspace.status.phase || !workspace.status.ideUrl) && attempted < this.maxStatusAttempts) {
      workspace = await this.dwApi.getByName(namespace, workspaceName);
      this.checkForDevWorkspaceError(workspace);
      attempted += 1;
      await delay();
    }
    this.checkForDevWorkspaceError(workspace);
    const workspaceStatus = workspace.status;
    if (!workspaceStatus || !workspaceStatus.phase) {
      throw new Error(`Could not retrieve devworkspace status information from ${workspaceName} in namespace ${namespace}`);
    } else if (workspaceStatus.phase === DevWorkspaceStatus.RUNNING && !workspaceStatus?.ideUrl) {
      throw new Error('Could not retrieve ideUrl for the running workspace');
    }
    return workspace;
  }

  async create(devfile: IDevWorkspaceDevfile, pluginsDevfile: IDevWorkspaceDevfile[]): Promise<IDevWorkspace> {
    if (!devfile.components) {
      devfile.components = [];
    }

    const createdWorkspace = await this.dwApi.create(devfile, 'che', false);
    const namespace = createdWorkspace.metadata.namespace;

    for (const pluginDevfile of pluginsDevfile) {
      // TODO handle error in a proper way
      const workspaceId = createdWorkspace.status.devworkspaceId;
      const pluginName = this.normalizePluginName(pluginDevfile.metadata.name, workspaceId);
      const devfileGroupVersion = `${devWorkspaceApiGroup}/${devworkspaceVersion}`;
      const theiaDWT = await this.dwtApi.create(<IDevWorkspaceTemplate>{
        kind: 'DevWorkspaceTemplate',
        apiVersion: devfileGroupVersion,
        metadata: {
          name: pluginName,
          namespace,
          ownerReferences: [
            {
              apiVersion: devfileGroupVersion,
              kind: devworkspaceSingularSubresource,
              name: createdWorkspace.metadata.name,
              uid: createdWorkspace.metadata.uid
            }
          ]
        },
        spec: pluginDevfile
      });

      this.addPlugin(createdWorkspace, pluginName, theiaDWT.metadata.namespace);
    }

    createdWorkspace.spec.started = true;
    const updatedWorkspace = await this.dwApi.update(createdWorkspace);

    return updatedWorkspace;
  }

  /**
   * Update a devworkspace.
   * If the workspace you want to update has the DEVWORKSPACE_NEXT_START_ANNOTATION then
   * patch the cluster object with the value of DEVWORKSPACE_NEXT_START_ANNOTATION and don't restart the devworkspace.
   *
   * If the workspace does not specify DEVWORKSPACE_NEXT_START_ANNOTATION then
   * update the spec of the devworkspace and remove DEVWORKSPACE_NEXT_START_ANNOTATION if it exists.
   *
   * @param workspace The DevWorkspace you want to update
   * @param plugins The plugins you want to inject into the devworkspace
   */
  async update(workspace: IDevWorkspace, plugins: IDevWorkspaceDevfile[]): Promise<IDevWorkspace> {
    // Take the devworkspace with no plugins and then inject them
    for (const plugin of plugins) {
      const pluginName = this.normalizePluginName(plugin.metadata.name, workspace.status.devworkspaceId);
      this.addPlugin(workspace, pluginName, workspace.metadata.namespace);
    }

    const namespace = workspace.metadata.namespace;
    const name = workspace.metadata.name;

    const patch: Patch[] = [];

    if (workspace.metadata.annotations && workspace.metadata.annotations[DEVWORKSPACE_NEXT_START_ANNOTATION]) {

      /**
       * This is the case when you are annotating a devworkspace and will restart it later
       */
      patch.push(
        {
          op: 'add',
          path: '/metadata/annotations',
          value: {
            [DEVWORKSPACE_NEXT_START_ANNOTATION]: workspace.metadata.annotations[DEVWORKSPACE_NEXT_START_ANNOTATION]
          }
        },

      );
    } else {
      /**
       * This is the case when you are updating a devworkspace normally
       */
      patch.push(
        {
          op: 'replace',
          path: '/spec',
          value: workspace.spec,
        }
      );
      const onClusterWorkspace = await this.getWorkspaceByName(namespace, name);

      // If the workspace currently has DEVWORKSPACE_NEXT_START_ANNOTATION then delete it since we are starting a devworkspace normally
      if (onClusterWorkspace.metadata.annotations && onClusterWorkspace.metadata.annotations[DEVWORKSPACE_NEXT_START_ANNOTATION]) {
        // We have to escape the slash when removing the annotation and ~1 is used as the escape character https://tools.ietf.org/html/rfc6902#appendix-A.14
        const escapedAnnotation = DEVWORKSPACE_NEXT_START_ANNOTATION.replace('/', '~1');
        patch.push(
          {
            op: 'remove',
            path: `/metadata/annotations/${escapedAnnotation}`,
          }
        );
      }
    }

    return this.dwApi.patch(namespace, name, patch);
  }

  /**
   * Created a normalize plugin name, which is a plugin name with all spaces replaced
   * to dashes and a workspaceId appended at the end
   * @param pluginName The name of the plugin
   * @param workspaceId The id of the workspace
   */
  private normalizePluginName(pluginName: string, workspaceId: string): string {
    return `${pluginName.replaceAll(' ', '-').toLowerCase()}-${workspaceId}`;
  }

  async delete(namespace: string, name: string): Promise<void> {
    await this.dwApi.delete(namespace, name);
  }

  async changeWorkspaceStatus(namespace: string, name: string, started: boolean): Promise<IDevWorkspace> {
    const changedWorkspace = await this.dwApi.changeStatus(namespace, name, started);
    if (started === false && changedWorkspace.status?.devworkspaceId) {
      this.lastDevWorkspaceLog.delete(changedWorkspace.status.devworkspaceId);
    }
    this.checkForDevWorkspaceError(changedWorkspace);
    return changedWorkspace;
  }

  /**
   * Add the plugin to the workspace
   * @param workspace A devworkspace
   * @param plugin A devworkspacetemplate
   */
  private addPlugin(workspace: IDevWorkspace, pluginName: string, namespace: string) {
    workspace.spec.template.components!.push({
      name: pluginName,
      plugin: {
        kubernetes: {
          name: pluginName,
          namespace
        }
      }
    });
  }

  /**
   * Initialize the given namespace
   * @param namespace The namespace you want to initialize
   * @returns If the namespace has been initialized
   */
  async initializeNamespace(namespace: string): Promise<boolean> {
    try {
      await this.dwCheApi.initializeNamespace(namespace);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  subscribeToNamespace(
    defaultNamespace: string,
    callback: (workspace: IDevWorkspace, message: IStatusUpdate) => AppThunk<Action, void>,
    dispatch: ThunkDispatch<State, undefined, Action>,
    getState: () => AppState,
  ): void {
    setInterval(async () => {
      // This is a temporary solution until websockets work. Ideally we should just have a websocket connection here.
      const devworkspaces = await this.getAllWorkspaces(defaultNamespace);
      devworkspaces.forEach((devworkspace: IDevWorkspace) => {
        const statusUpdate = this.createStatusUpdate(devworkspace);

        const message = devworkspace.status.message;
        if (message) {
          const workspaceId = devworkspace.status.devworkspaceId;
          const lastMessage = this.lastDevWorkspaceLog.get(workspaceId);

          // Only add new messages we haven't seen before
          if (lastMessage !== message) {
            statusUpdate.message = message;
            this.lastDevWorkspaceLog.set(workspaceId, message);
          }
        }
        callback(devworkspace, statusUpdate)(dispatch, getState, undefined);
      });
    }, 1000);
  }

  /**
   * Create a status update between the previously recieving DevWorkspace with a certain workspace id
   * and the new DevWorkspace
   * @param devworkspace The incoming DevWorkspace
   */
  private createStatusUpdate(devworkspace: IDevWorkspace): IStatusUpdate {
    const namespace = devworkspace.metadata.namespace;
    const workspaceId = devworkspace.status.devworkspaceId;
    // Starting devworkspaces don't have status defined
    const status = typeof devworkspace.status.phase === 'string'
      ? devworkspace.status.phase.toUpperCase()
      : WorkspaceStatus[WorkspaceStatus.STARTING];

    const prevWorkspace = this.previousItems.get(namespace);
    if (prevWorkspace) {
      const prevStatus = prevWorkspace.get(workspaceId);
      const newUpdate: IStatusUpdate = {
        workspaceId: workspaceId,
        status: status,
        prevStatus: prevStatus?.status,
      };
      prevWorkspace.set(workspaceId, newUpdate);
      return newUpdate;
    } else {
      // there is not a previous update
      const newStatus: IStatusUpdate = {
        workspaceId,
        status: status,
        prevStatus: status,
      };

      const newStatusMap = new Map<string, IStatusUpdate>();
      newStatusMap.set(workspaceId, newStatus);
      this.previousItems.set(namespace, newStatusMap);
      return newStatus;
    }
  }

  checkForDevWorkspaceError(devworkspace: IDevWorkspace) {
    const currentPhase = devworkspace.status?.phase;
    if (currentPhase && currentPhase === DevWorkspaceStatus.FAILED) {
      const message = devworkspace.status.message;
      if (message) {
        throw new Error(devworkspace.status.message);
      }
      throw new Error('Unknown error occured when trying to process the devworkspace');
    }
  }
}
