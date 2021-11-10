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

import { inject, injectable, multiInject } from 'inversify';
import { isWebTerminal } from '../../helpers/devworkspace';
import { WorkspaceClient } from '../index';
import devfileApi, { isDevWorkspace } from '../../devfileApi';
import { api } from '@eclipse-che/common';
import {
  devfileToDevWorkspace,
  devWorkspaceApiGroup,
  devworkspaceSingularSubresource,
  devworkspaceVersion,
} from './converters';
import { AlertItem, DevWorkspaceStatus } from '../../helpers/types';
import { KeycloakSetupService } from '../../keycloak/setup';
import { delay } from '../../helpers/delay';
import * as DwApi from '../../dashboard-backend-client/devWorkspaceApi';
import * as DwtApi from '../../dashboard-backend-client/devWorkspaceTemplateApi';
import { WebsocketClient, SubscribeMessage } from '../../dashboard-backend-client/websocketClient';
import { EventEmitter } from 'events';
import { AppAlerts } from '../../alerts/appAlerts';
import { AlertVariant } from '@patternfly/react-core';
import { WorkspaceAdapter } from '../../workspace-adapter';
import { safeLoad } from 'js-yaml';
import { DEVWORKSPACE_UPDATING_TIMESTAMP_ANNOTATION } from '../../devfileApi/devWorkspace/metadata';
import { AxiosInstance } from 'axios';
import { V220DevfileComponentsItemsContainer } from '@devfile/api';

export interface IStatusUpdate {
  error?: string;
  message?: string;
  status?: string;
  prevStatus?: string;
  workspaceId: string;
}

export type Subscriber = {
  namespace: string;
  callbacks: {
    getResourceVersion: () => Promise<string | undefined>;
    updateDevWorkspaceStatus: (message: IStatusUpdate) => void;
    updateDeletedDevWorkspaces: (deletedWorkspacesIds: string[]) => void;
    updateAddedDevWorkspaces: (workspace: devfileApi.DevWorkspace[]) => void;
  };
};

/**
 * Context provided to all editors when they need to process devfile
 */
export interface IDevWorkspaceEditorProcessingContext {
  devfile: devfileApi.Devfile;

  devWorkspace: devfileApi.DevWorkspace;

  workspaceId: string;

  devWorkspaceTemplates: devfileApi.DevWorkspaceTemplateLike[];

  editorsDevfile: devfileApi.Devfile[];

  pluginRegistryUrl?: string;

  axios: AxiosInstance;

  optionalFilesContent: { [fileName: string]: string };
}

/**
 * Editors need to implement this interface in dashboard to apply their stuff on top of devfiles
 */
export const IDevWorkspaceEditorProcess = Symbol.for('IDevWorkspaceEditorProcess');
export interface IDevWorkspaceEditorProcess {
  /**
   * Returns true if the implementation is supporting the given devfile
   */
  match(context: IDevWorkspaceEditorProcessingContext): boolean;

  /**
   * Apply specific stuff of the editor
   */
  apply(context: IDevWorkspaceEditorProcessingContext): Promise<void>;
}

export const DEVWORKSPACE_NEXT_START_ANNOTATION = 'che.eclipse.org/next-start-cfg';

export const DEVWORKSPACE_DEBUG_START_ANNOTATION = 'controller.devfile.io/debug-start';

export const DEVWORKSPACE_DEVFILE_SOURCE = 'che.eclipse.org/devfile-source';

export const DEVWORKSPACE_METADATA_ANNOTATION = 'dw.metadata.annotations';

export interface ICheEditorOverrideContainer extends V220DevfileComponentsItemsContainer {
  name: string;
}
export interface ICheEditorYaml {
  inline?: devfileApi.Devfile;
  id?: string;
  reference?: string;
  registryUrl?: string;
  override?: {
    containers: ICheEditorOverrideContainer[];
  };
}

/**
 * This class manages the connection between the frontend and the devworkspace typescript library
 */
@injectable()
export class DevWorkspaceClient extends WorkspaceClient {
  private subscriber: Subscriber | undefined;
  private previousItems: Map<string, Map<string, IStatusUpdate>>;
  private readonly maxStatusAttempts: number;
  private lastDevWorkspaceLog: Map<string, string>;
  private readonly pluginRegistryUrlEnvName: string;
  private readonly pluginRegistryInternalUrlEnvName: string;
  private readonly dashboardUrlEnvName: string;
  private readonly websocketClient: WebsocketClient;
  private webSocketEventEmitter: EventEmitter;
  private readonly webSocketEventName: string;
  private readonly _failingWebSockets: string[];
  private readonly showAlert: (alert: AlertItem) => void;

  constructor(
    @inject(KeycloakSetupService) keycloakSetupService: KeycloakSetupService,
    @inject(AppAlerts) appAlerts: AppAlerts,
    @multiInject(IDevWorkspaceEditorProcess) private editorProcesses: IDevWorkspaceEditorProcess[],
  ) {
    super(keycloakSetupService);
    this.previousItems = new Map();
    this.maxStatusAttempts = 10;
    this.lastDevWorkspaceLog = new Map();
    this.pluginRegistryUrlEnvName = 'CHE_PLUGIN_REGISTRY_URL';
    this.pluginRegistryInternalUrlEnvName = 'CHE_PLUGIN_REGISTRY_INTERNAL_URL';
    this.dashboardUrlEnvName = 'CHE_DASHBOARD_URL';
    this.webSocketEventEmitter = new EventEmitter();
    this.webSocketEventName = 'websocketClose';
    this._failingWebSockets = [];

    this.showAlert = (alert: AlertItem) => appAlerts.showAlert(alert);

    this.websocketClient = new WebsocketClient({
      onDidWebSocketFailing: (websocketContext: string) => {
        this._failingWebSockets.push(websocketContext);
        this.webSocketEventEmitter.emit(this.webSocketEventName);
      },
      onDidWebSocketOpen: (websocketContext: string) => {
        const index = this._failingWebSockets.indexOf(websocketContext);
        if (index !== -1) {
          this._failingWebSockets.splice(index, 1);
          this.webSocketEventEmitter.emit(this.webSocketEventName);
        }
        this.subscribe().catch(e => {
          const key = 'websocket-subscribe-error';
          const title = `Websocket '${websocketContext}' subscribe Error: ${e}`;
          this.showAlert({ key, variant: AlertVariant.danger, title });
        });
      },
      onDidWebSocketClose: (event: CloseEvent) => {
        if (event.code !== 1011 && event.reason) {
          const key = `websocket-close-code-${event.code}`;
          this.showAlert({
            key,
            variant: AlertVariant.warning,
            title: 'Failed to establish WebSocket to server: ' + event.reason,
          });
        } else {
          console.warn('WebSocket close', event);
        }
      },
    });
  }

  onWebSocketFailed(callback: () => void) {
    this.webSocketEventEmitter.on(this.webSocketEventName, callback);
  }

  removeWebSocketFailedListener() {
    this.webSocketEventEmitter.removeAllListeners(this.webSocketEventName);
    this._failingWebSockets.length = 0;
  }

  get failingWebSockets(): string[] {
    return Array.from(this._failingWebSockets);
  }

  async getAllWorkspaces(
    defaultNamespace: string,
  ): Promise<{ workspaces: devfileApi.DevWorkspace[]; resourceVersion: string }> {
    const {
      items,
      metadata: { resourceVersion },
    } = await DwApi.listWorkspacesInNamespace(defaultNamespace);
    const workspaces: devfileApi.DevWorkspace[] = [];
    for (const item of items) {
      if (!isWebTerminal(item)) {
        workspaces.push(item);
      }
    }
    return { workspaces, resourceVersion };
  }

  async getWorkspaceByName(
    namespace: string,
    workspaceName: string,
  ): Promise<devfileApi.DevWorkspace> {
    let workspace = await DwApi.getWorkspaceByName(namespace, workspaceName);
    let attempted = 0;
    while (
      (!workspace.status?.phase || !workspace.status.mainUrl) &&
      attempted < this.maxStatusAttempts
    ) {
      workspace = await DwApi.getWorkspaceByName(namespace, workspaceName);
      attempted += 1;
      await delay();
    }
    const workspaceStatus = workspace?.status;
    if (!workspaceStatus || !workspaceStatus.phase) {
      throw new Error(
        `Could not retrieve devworkspace status information from ${workspaceName} in namespace ${namespace}`,
      );
    } else if (workspaceStatus.phase === DevWorkspaceStatus.RUNNING && !workspaceStatus?.mainUrl) {
      throw new Error('Could not retrieve mainUrl for the running workspace');
    }
    return workspace;
  }

  async create(
    devfile: devfileApi.Devfile,
    defaultNamespace: string,
    pluginsDevfile: devfileApi.Devfile[],
    pluginRegistryUrl: string | undefined,
    pluginRegistryInternalUrl: string | undefined,
    optionalFilesContent: { [fileName: string]: string },
  ): Promise<devfileApi.DevWorkspace> {
    if (!devfile.components) {
      devfile.components = [];
    }
    if (!devfile.metadata.namespace) {
      devfile.metadata.namespace = defaultNamespace;
    }

    const routingClass = 'che';
    const devworkspace = devfileToDevWorkspace(devfile, routingClass, true);

    if (devworkspace.metadata.annotations === undefined) {
      devworkspace.metadata.annotations = {};
    }
    devworkspace.metadata.annotations[DEVWORKSPACE_UPDATING_TIMESTAMP_ANNOTATION] =
      new Date().toISOString();

    const createdWorkspace = await DwApi.createWorkspace(devworkspace);
    const namespace = createdWorkspace.metadata.namespace;
    const name = createdWorkspace.metadata.name;
    const workspaceId = WorkspaceAdapter.getId(createdWorkspace);

    // do we have inline editor as part of the devfile ?
    const inlineEditorYaml =
      (devfile as any).attributes && (devfile as any).attributes['che-editor.yaml']
        ? (safeLoad((devfile as any).attributes['che-editor.yaml']) as devfileApi.Devfile)
        : undefined;

    const devfileGroupVersion = `${devWorkspaceApiGroup}/${devworkspaceVersion}`;
    const devWorkspaceTemplates: devfileApi.DevWorkspaceTemplateLike[] = [];

    // do we have a custom editor specified in the repository ?
    const cheEditorYaml = optionalFilesContent['.che/che-editor.yaml']
      ? (safeLoad(optionalFilesContent['.che/che-editor.yaml']) as ICheEditorYaml)
      : undefined;

    const editorsDevfile: devfileApi.Devfile[] = [];
    // handle inlined editor in the devfile
    if (inlineEditorYaml) {
      console.debug('Using inline editor specified in the devfile', inlineEditorYaml);
      editorsDevfile.push(inlineEditorYaml);
    } else if (cheEditorYaml) {
      // check the content of cheEditor file
      console.debug('Using the repository .che/che-editor.yaml file', cheEditorYaml);

      let repositoryEditorYaml;
      let repositoryEditorYamlUrl;
      // it's an inlined editor, use the inline content
      if (cheEditorYaml.inline) {
        console.debug('Using the inline content of the repository editor');
        repositoryEditorYaml = cheEditorYaml.inline;
      } else if (cheEditorYaml.id) {
        // load the content of this editor
        console.debug(`Loading editor from its id ${cheEditorYaml.id}`);

        // registryUrl ?
        if (cheEditorYaml.registryUrl) {
          repositoryEditorYamlUrl = `${cheEditorYaml.registryUrl}/plugins/${cheEditorYaml.id}/devfile.yaml`;
        } else {
          repositoryEditorYamlUrl = `${pluginRegistryUrl}/plugins/${cheEditorYaml.id}/devfile.yaml`;
        }
      } else if (cheEditorYaml.reference) {
        // load the content of this editor
        console.debug(`Loading editor from reference ${cheEditorYaml.reference}`);
        repositoryEditorYamlUrl = cheEditorYaml.reference;
      }
      if (repositoryEditorYamlUrl) {
        const response = await this.axios.get<string>(repositoryEditorYamlUrl, {
          responseType: 'text',
        });
        if (response.data) {
          repositoryEditorYaml = safeLoad(response.data);
        }
      }

      // if there are some overrides, apply them
      if (cheEditorYaml.override) {
        console.debug(`Applying overrides ${JSON.stringify(cheEditorYaml.override)}...`);
        cheEditorYaml.override.containers?.forEach(container => {
          // search matching component
          const matchingComponent = repositoryEditorYaml.components?.find(
            component => component.name === container.name,
          );
          if (matchingComponent) {
            // apply overrides except the name
            Object.keys(container).forEach(property => {
              if (property !== 'name') {
                console.debug(
                  `Updating property from ${matchingComponent.container[property]} to ${container[property]}`,
                );
                matchingComponent.container[property] = container[property];
              }
            });
          }
        });
      }

      if (!repositoryEditorYaml) {
        throw new Error(
          'Failed to analyze the editor devfile inside the repository, reason: Missing id, reference or inline content.',
        );
      }
      // Use the repository defined editor
      editorsDevfile.push(repositoryEditorYaml);
    } else {
      editorsDevfile.push(...pluginsDevfile);
    }

    for (const pluginDevfile of editorsDevfile) {
      if (!pluginDevfile || !pluginDevfile.metadata || !pluginDevfile.metadata.name) {
        throw new Error(
          'Failed to analyze the editor devfile, reason: Missing metadata.name attribute in the editor yaml file.',
        );
      }
      const pluginName = this.normalizePluginName(pluginDevfile.metadata.name, workspaceId);

      const editorDWT = {
        kind: 'DevWorkspaceTemplate',
        apiVersion: devfileGroupVersion,
        metadata: {
          name: pluginName,
          namespace,
        },
        spec: pluginDevfile,
      };
      devWorkspaceTemplates.push(editorDWT);
    }

    const editorProcessContext: IDevWorkspaceEditorProcessingContext = {
      devfile,
      devWorkspace: createdWorkspace,
      workspaceId,
      devWorkspaceTemplates,
      editorsDevfile,
      pluginRegistryUrl,
      axios: this.axios,
      optionalFilesContent,
    };

    // if editors have some specific enhancements
    await this.applySpecificEditors(editorProcessContext);

    await Promise.all(
      devWorkspaceTemplates.map(async template => {
        if (!template.metadata) {
          template.metadata = {};
        }

        // Update the namespace
        template.metadata.namespace = namespace;

        // Update owner reference (to allow automatic cleanup)
        template.metadata.ownerReferences = [
          {
            apiVersion: devfileGroupVersion,
            kind: devworkspaceSingularSubresource,
            name: createdWorkspace.metadata.name,
            uid: createdWorkspace.metadata.uid,
          },
        ];

        // propagate the plugin registry and dashboard urls to the containers in the initial devworkspace templates
        if (template.spec?.components) {
          for (const component of template.spec?.components) {
            const container = component.container;
            if (container) {
              if (!container.env) {
                container.env = [];
              }
              container.env.push(
                ...[
                  {
                    name: this.dashboardUrlEnvName,
                    value: window.location.origin,
                  },
                  {
                    name: this.pluginRegistryUrlEnvName,
                    value: pluginRegistryUrl || '',
                  },
                  {
                    name: this.pluginRegistryInternalUrlEnvName,
                    value: pluginRegistryInternalUrl || '',
                  },
                ],
              );
            }
          }
        }

        const pluginDWT = await DwtApi.createTemplate(<devfileApi.DevWorkspaceTemplate>template);
        this.addPlugin(createdWorkspace, pluginDWT.metadata.name, pluginDWT.metadata.namespace);
      }),
    );

    createdWorkspace.spec.started = true;
    const patch = [
      {
        op: 'replace',
        path: '/spec',
        value: createdWorkspace.spec,
      },
    ];
    return DwApi.patchWorkspace(namespace, name, patch);
  }

  // Stuff to do for some editors
  protected async applySpecificEditors(
    context: IDevWorkspaceEditorProcessingContext,
  ): Promise<void> {
    const matchingProcessors = this.editorProcesses.filter(editorProcessor =>
      editorProcessor.match(context),
    );
    const start = performance.now();
    // apply processors
    await Promise.all(matchingProcessors.map(processor => processor.apply(context)));
    const end = performance.now();

    // notify if we processed stuff
    if (matchingProcessors.length > 0) {
      console.debug(
        `Took ${end - start}ms to apply editor specific changes`,
        'Devfile updated to',
        context.devfile,
        ' and templates updated to',
        context.devWorkspaceTemplates,
      );
    }
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
  async update(
    workspace: devfileApi.DevWorkspace,
    plugins: devfileApi.Devfile[] = [],
  ): Promise<devfileApi.DevWorkspace> {
    // Take the devworkspace with no plugins and then inject them
    for (const plugin of plugins) {
      if (!plugin.metadata) {
        continue;
      }
      const pluginName = this.normalizePluginName(
        plugin.metadata.name,
        WorkspaceAdapter.getId(workspace),
      );
      this.addPlugin(workspace, pluginName, workspace.metadata.namespace);
    }

    const namespace = workspace.metadata.namespace;
    const name = workspace.metadata.name;

    const patch: api.IPatch[] = [];

    const updatingTimeAnnotationPath =
      '/metadata/annotations/' + this.escape(DEVWORKSPACE_UPDATING_TIMESTAMP_ANNOTATION);
    if (
      workspace.metadata.annotations?.[DEVWORKSPACE_UPDATING_TIMESTAMP_ANNOTATION] === undefined
    ) {
      patch.push({
        op: 'add',
        path: updatingTimeAnnotationPath,
        value: new Date().toISOString(),
      });
    } else {
      patch.push({
        op: 'replace',
        path: updatingTimeAnnotationPath,
        value: new Date().toISOString(),
      });
    }

    const nextStartAnnotationPath =
      '/metadata/annotations/' + this.escape(DEVWORKSPACE_NEXT_START_ANNOTATION);
    if (workspace.metadata.annotations?.[DEVWORKSPACE_NEXT_START_ANNOTATION]) {
      /**
       * This is the case when you are annotating a devworkspace and will restart it later
       */
      patch.push({
        op: 'add',
        path: nextStartAnnotationPath,
        value: workspace.metadata.annotations[DEVWORKSPACE_NEXT_START_ANNOTATION],
      });
    } else {
      /**
       * This is the case when you are updating a devworkspace normally
       */
      patch.push({
        op: 'replace',
        path: '/spec',
        value: workspace.spec,
      });
      const onClusterWorkspace = await this.getWorkspaceByName(namespace, name);

      // If the workspace currently has DEVWORKSPACE_NEXT_START_ANNOTATION then delete it since we are starting a devworkspace normally
      if (
        onClusterWorkspace.metadata.annotations &&
        onClusterWorkspace.metadata.annotations[DEVWORKSPACE_NEXT_START_ANNOTATION]
      ) {
        patch.push({
          op: 'remove',
          path: nextStartAnnotationPath,
        });
      }
    }

    return DwApi.patchWorkspace(namespace, name, patch);
  }

  private escape(key: string): string {
    // We have to escape the slash and use ~1 instead. See https://tools.ietf.org/html/rfc6902#appendix-A.14
    return key.replace(/\//g, '~1');
  }

  /**
   * Created a normalize plugin name, which is a plugin name with all spaces replaced
   * to dashes and a workspaceId appended at the end
   * @param pluginName The name of the plugin
   * @param workspaceId The id of the workspace
   */
  private normalizePluginName(pluginName: string, workspaceId: string): string {
    return `${pluginName.replace(/ /g, '-').toLowerCase()}-${workspaceId}`;
  }

  async delete(namespace: string, name: string): Promise<void> {
    await DwApi.deleteWorkspace(namespace, name);
  }

  getDebugMode(workspace: devfileApi.DevWorkspace): boolean {
    return workspace.metadata.annotations?.[DEVWORKSPACE_DEBUG_START_ANNOTATION] === 'true';
  }

  async updateDebugMode(
    workspace: devfileApi.DevWorkspace,
    debugMode: boolean,
  ): Promise<devfileApi.DevWorkspace> {
    const patch: api.IPatch[] = [];
    const currentDebugMode = this.getDebugMode(workspace);

    if (currentDebugMode === debugMode) {
      return workspace;
    }

    const path = `/metadata/annotations/${this.escape(DEVWORKSPACE_DEBUG_START_ANNOTATION)}`;
    if (!debugMode) {
      patch.push({ op: 'remove', path });
    } else {
      if (workspace.metadata.annotations?.[DEVWORKSPACE_DEBUG_START_ANNOTATION]) {
        patch.push({ op: 'replace', path, value: 'true' });
      } else {
        patch.push({ op: 'add', path, value: 'true' });
      }
    }

    return await DwApi.patchWorkspace(workspace.metadata.namespace, workspace.metadata.name, patch);
  }

  async changeWorkspaceStatus(
    workspace: devfileApi.DevWorkspace,
    started: boolean,
    skipErrorCheck?: boolean,
  ): Promise<devfileApi.DevWorkspace> {
    const patch: api.IPatch[] = [
      {
        op: 'replace',
        path: '/spec/started',
        value: started,
      },
    ];

    if (started) {
      const updatingTimeAnnotationPath =
        '/metadata/annotations/' + this.escape(DEVWORKSPACE_UPDATING_TIMESTAMP_ANNOTATION);
      if (
        workspace.metadata.annotations?.[DEVWORKSPACE_UPDATING_TIMESTAMP_ANNOTATION] === undefined
      ) {
        patch.push({
          op: 'add',
          path: updatingTimeAnnotationPath,
          value: new Date().toISOString(),
        });
      } else {
        patch.push({
          op: 'replace',
          path: updatingTimeAnnotationPath,
          value: new Date().toISOString(),
        });
      }
    }

    const changedWorkspace = await DwApi.patchWorkspace(
      workspace.metadata.namespace,
      workspace.metadata.name,
      patch,
    );
    if (!started) {
      this.lastDevWorkspaceLog.delete(WorkspaceAdapter.getId(changedWorkspace));
    }
    if (!skipErrorCheck) {
      this.checkForDevWorkspaceError(changedWorkspace);
    }
    return changedWorkspace;
  }

  /**
   * Add the plugin to the workspace
   * @param workspace A devworkspace
   * @param pluginName The name of the plugin
   * @param namespace A namespace
   */
  private addPlugin(workspace: devfileApi.DevWorkspace, pluginName: string, namespace: string) {
    if (!workspace.spec.template.components) {
      workspace.spec.template.components = [];
    }
    const components = workspace.spec.template.components.filter(
      component => component.name !== pluginName,
    );
    components.push({
      name: pluginName,
      plugin: {
        kubernetes: {
          name: pluginName,
          namespace,
        },
      },
    });
    workspace.spec.template.components = components;
  }

  async subscribeToNamespace(subscriber: Subscriber): Promise<void> {
    this.subscriber = subscriber;
    await this.websocketClient.connect();
  }

  private async subscribe(): Promise<void> {
    if (!this.subscriber) {
      throw 'Error: Subscriber does not set.';
    }

    const { namespace, callbacks } = this.subscriber;
    const getSubscribeMessage = async (channel: string): Promise<SubscribeMessage> => {
      return {
        request: 'SUBSCRIBE',
        params: { namespace, resourceVersion: await callbacks.getResourceVersion() },
        channel,
      };
    };

    const onModified = 'onModified';
    await this.websocketClient.subscribe(await getSubscribeMessage(onModified));
    this.websocketClient.addListener(onModified, (devworkspace: unknown) => {
      if (!isDevWorkspace(devworkspace)) {
        const title = `WebSocket channel "${onModified}" received object that is not a devWorkspace, skipping it.`;
        const key = `${onModified}-websocket-channel`;
        console.warn(title, devworkspace);
        this.showAlert({ key, variant: AlertVariant.warning, title });
        return;
      }
      const statusUpdate = this.createStatusUpdate(devworkspace);
      const statusMessage = devworkspace.status?.message;
      if (statusMessage) {
        const workspaceId = WorkspaceAdapter.getId(devworkspace);
        const lastMessage = this.lastDevWorkspaceLog.get(workspaceId);
        // Only add new messages we haven't seen before
        if (lastMessage !== statusMessage) {
          statusUpdate.message = statusMessage;
          this.lastDevWorkspaceLog.set(workspaceId, statusMessage);
        }
      }
      callbacks.updateDevWorkspaceStatus(statusUpdate);
    });

    const onAdded = 'onAdded';
    await this.websocketClient.subscribe(await getSubscribeMessage(onAdded));
    this.websocketClient.addListener(onAdded, (devworkspace: unknown) => {
      if (!isDevWorkspace(devworkspace)) {
        const title = `WebSocket channel "${onAdded}" received object that is not a devWorkspace, skipping it.`;
        const key = `${onAdded}-websocket-channel`;
        console.warn(title, devworkspace);
        this.showAlert({ key, variant: AlertVariant.warning, title });
        return;
      }
      callbacks.updateAddedDevWorkspaces([devworkspace]);
    });

    const onDeleted = 'onDeleted';
    await this.websocketClient.subscribe(await getSubscribeMessage(onDeleted));
    this.websocketClient.addListener(onDeleted, (maybeWorkspaceId: unknown) => {
      if (typeof maybeWorkspaceId !== 'string') {
        const title = `WebSocket channel "${onDeleted}" received value is not a string, skipping it.`;
        const key = `${onDeleted}-websocket-channel`;
        console.warn(title, maybeWorkspaceId, typeof maybeWorkspaceId);
        this.showAlert({ key, variant: AlertVariant.warning, title });
        return;
      }
      const workspaceId = maybeWorkspaceId as string;
      callbacks.updateDeletedDevWorkspaces([workspaceId]);
    });
  }

  /**
   * Create a status update between the previously receiving DevWorkspace with a certain workspace id
   * and the new DevWorkspace
   * @param devworkspace The incoming DevWorkspace
   */
  private createStatusUpdate(devworkspace: devfileApi.DevWorkspace): IStatusUpdate {
    const namespace = devworkspace.metadata.namespace;
    const workspaceId = WorkspaceAdapter.getId(devworkspace);
    // Starting devworkspaces don't have status defined
    const status =
      typeof devworkspace?.status?.phase === 'string'
        ? devworkspace.status.phase
        : DevWorkspaceStatus.STARTING;

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

  checkForDevWorkspaceError(devworkspace: devfileApi.DevWorkspace) {
    const currentPhase = WorkspaceAdapter.getStatus(devworkspace);
    if (currentPhase && currentPhase === DevWorkspaceStatus.FAILED) {
      const message = devworkspace.status?.message;
      if (message) {
        throw new Error(message);
      }
      throw new Error('Unknown error occured when trying to process the devworkspace');
    }
  }
}
