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
  devWorkspaceSingularSubresource,
  devWorkspaceVersion,
} from './converters';
import { AlertItem, DevWorkspaceStatus, isDevWorkspaceStatus } from '../../helpers/types';
import { delay } from '../../helpers/delay';
import * as DwApi from '../../dashboard-backend-client/devWorkspaceApi';
import * as DwtApi from '../../dashboard-backend-client/devWorkspaceTemplateApi';
import { WebsocketClient, SubscribeMessage } from '../../dashboard-backend-client/websocketClient';
import { EventEmitter } from 'events';
import { AppAlerts } from '../../alerts/appAlerts';
import { AlertVariant } from '@patternfly/react-core';
import { WorkspaceAdapter } from '../../workspace-adapter';
import { safeLoad } from 'js-yaml';
import {
  DEVWORKSPACE_CHE_EDITOR,
  DEVWORKSPACE_UPDATING_TIMESTAMP_ANNOTATION,
} from '../../devfileApi/devWorkspace/metadata';
import { AxiosInstance } from 'axios';
import {
  V1alpha2DevWorkspaceSpecTemplateComponents,
  V1alpha2DevWorkspaceTemplateSpec,
  V1alpha2DevWorkspaceTemplateSpecComponents,
  V220DevfileComponentsItemsContainer,
} from '@devfile/api';
import { cloneDeep, isEqual } from 'lodash';
import { fetchData } from '../../registry/fetchData';
import { DevWorkspaceDefaultPluginsHandler } from './DevWorkspaceDefaultPluginsHandler';
import { WorkspacesDefaultPlugins } from 'dashboard-frontend/src/store/Plugins/devWorkspacePlugins';

export interface IStatusUpdate {
  status: DevWorkspaceStatus;
  message: string;
  prevStatus: string | undefined;
  workspaceUID: string;
  mainUrl?: string;
  namespace?: string;
  workspaceId?: string;
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

const COMPONENT_UPDATE_POLICY = 'che.eclipse.org/components-update-policy';
const REGISTRY_URL = 'che.eclipse.org/plugin-registry-url';

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

export const DEVWORKSPACE_CONFIG_ANNOTATION = 'controller.devfile.io/devworkspace-config';

export const DEVWORKSPACE_STORAGE_TYPE = 'controller.devfile.io/storage-type';

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
  private readonly pluginRegistryUrlEnvName: string;
  private readonly pluginRegistryInternalUrlEnvName: string;
  private readonly openVSXUrlEnvName: string;
  private readonly dashboardUrlEnvName: string;
  private readonly websocketClient: WebsocketClient;
  private webSocketEventEmitter: EventEmitter;
  private readonly webSocketEventName: string;
  private readonly _failingWebSockets: string[];
  private readonly showAlert: (alert: AlertItem) => void;
  private readonly defaultPluginsHandler: DevWorkspaceDefaultPluginsHandler;

  constructor(
    @inject(AppAlerts) appAlerts: AppAlerts,
    @inject(DevWorkspaceDefaultPluginsHandler)
    defaultPluginsHandler: DevWorkspaceDefaultPluginsHandler,
    @multiInject(IDevWorkspaceEditorProcess) private editorProcesses: IDevWorkspaceEditorProcess[],
  ) {
    super();
    this.previousItems = new Map();
    this.maxStatusAttempts = 10;
    this.pluginRegistryUrlEnvName = 'CHE_PLUGIN_REGISTRY_URL';
    this.pluginRegistryInternalUrlEnvName = 'CHE_PLUGIN_REGISTRY_INTERNAL_URL';
    this.openVSXUrlEnvName = 'OPENVSX_REGISTRY_URL';
    this.dashboardUrlEnvName = 'CHE_DASHBOARD_URL';
    this.webSocketEventEmitter = new EventEmitter();
    this.webSocketEventName = 'websocketClose';
    this._failingWebSockets = [];
    this.defaultPluginsHandler = defaultPluginsHandler;

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
    while (!workspace.status?.phase && attempted < this.maxStatusAttempts) {
      if (attempted > 0) {
        await delay();
      }
      workspace = await DwApi.getWorkspaceByName(namespace, workspaceName);
      attempted++;
    }
    const workspaceStatus = workspace?.status;
    if (!workspaceStatus || !workspaceStatus.phase) {
      console.warn(
        `Could not retrieve devworkspace status information from ${workspaceName} in namespace ${namespace}`,
      );
    } else if (workspaceStatus.phase === DevWorkspaceStatus.RUNNING && !workspaceStatus?.mainUrl) {
      console.warn('Could not retrieve mainUrl for the running workspace');
    }
    return workspace;
  }

  async createFromResources(
    defaultNamespace: string,
    devworkspace: devfileApi.DevWorkspace,
    devworkspaceTemplate: devfileApi.DevWorkspaceTemplate,
    editorId: string | undefined,
    pluginRegistryUrl: string | undefined,
    pluginRegistryInternalUrl: string | undefined,
    openVSXUrl: string | undefined,
  ): Promise<any> {
    // create DW
    devworkspace.spec.routingClass = 'che';
    devworkspace.metadata.namespace = defaultNamespace;
    if (!devworkspace.metadata.annotations) {
      devworkspace.metadata.annotations = {};
    }
    devworkspace.metadata.annotations[DEVWORKSPACE_UPDATING_TIMESTAMP_ANNOTATION] =
      new Date().toISOString();
    // remove components which is not created yet
    const components = devworkspace.spec.template.components;
    devworkspace.spec.template.components = [];

    if (editorId) {
      devworkspace.metadata.annotations[DEVWORKSPACE_CHE_EDITOR] = editorId;
    }

    devworkspace.spec.started = false;
    const createdWorkspace = await DwApi.createWorkspace(devworkspace);

    this.addEnvVarsToContainers(
      components,
      pluginRegistryUrl,
      pluginRegistryInternalUrl,
      openVSXUrl,
    );

    // create DWT
    devworkspaceTemplate.metadata.namespace = defaultNamespace;
    // add owner reference (to allow automatic cleanup)
    devworkspaceTemplate.metadata.ownerReferences = [
      {
        apiVersion: `${devWorkspaceApiGroup}/${devWorkspaceVersion}`,
        kind: devWorkspaceSingularSubresource,
        name: createdWorkspace.metadata.name,
        uid: createdWorkspace.metadata.uid,
      },
    ];
    this.addEnvVarsToContainers(
      devworkspaceTemplate.spec?.components,
      pluginRegistryUrl,
      pluginRegistryInternalUrl,
      openVSXUrl,
    );

    await DwtApi.createTemplate(devworkspaceTemplate);

    // update DW
    return DwApi.patchWorkspace(
      createdWorkspace.metadata.namespace,
      createdWorkspace.metadata.name,
      [
        {
          op: 'replace',
          path: '/spec/template/components',
          value: components,
        },
      ],
    );
    await delay();
  }

  async createFromDevfile(
    devfile: devfileApi.Devfile,
    defaultNamespace: string,
    dwEditorsPlugins: { devfile: devfileApi.Devfile; url: string }[],
    pluginRegistryUrl: string | undefined,
    pluginRegistryInternalUrl: string | undefined,
    openVSXUrl: string | undefined,
    editorId: string | undefined,
    optionalFilesContent: { [fileName: string]: string },
  ): Promise<devfileApi.DevWorkspace> {
    if (!devfile.components) {
      devfile.components = [];
    }
    if (!devfile.metadata.namespace) {
      devfile.metadata.namespace = defaultNamespace;
    }

    const routingClass = 'che';
    const devworkspace = devfileToDevWorkspace(devfile, routingClass, false);

    if (devworkspace.metadata.annotations === undefined) {
      devworkspace.metadata.annotations = {};
    }
    devworkspace.metadata.annotations[DEVWORKSPACE_UPDATING_TIMESTAMP_ANNOTATION] =
      new Date().toISOString();

    if (editorId) {
      devworkspace.metadata.annotations[DEVWORKSPACE_CHE_EDITOR] = editorId;
    }
    devworkspace.spec.started = false;

    const createdWorkspace = await DwApi.createWorkspace(devworkspace);
    const namespace = createdWorkspace.metadata.namespace;
    const name = createdWorkspace.metadata.name;
    const workspaceId = WorkspaceAdapter.getId(createdWorkspace);

    // do we have inline editor as part of the devfile ?
    const inlineEditorYaml = devfile?.attributes?.['che-editor.yaml']
      ? (safeLoad(devfile.attributes['che-editor.yaml']) as devfileApi.Devfile)
      : undefined;
    const devfileGroupVersion = `${devWorkspaceApiGroup}/${devWorkspaceVersion}`;
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
      editorsDevfile.push(...dwEditorsPlugins.map(entry => entry.devfile));
    }
    for (const pluginDevfile of editorsDevfile) {
      if (!pluginDevfile || !pluginDevfile.metadata || !pluginDevfile.metadata.name) {
        throw new Error(
          'Failed to analyze the editor devfile, reason: Missing metadata.name attribute in the editor yaml file.',
        );
      }
      const pluginName = this.normalizePluginName(pluginDevfile.metadata.name, workspaceId);
      const editorDWT: devfileApi.DevWorkspaceTemplateLike = {
        kind: 'DevWorkspaceTemplate',
        apiVersion: devfileGroupVersion,
        metadata: {
          name: pluginName,
          namespace,
        },
        spec: pluginDevfile,
      };

      const unmanagedEditors = ['che-code', 'idea', 'pycharm'];
      dwEditorsPlugins.forEach(plugin => {
        if (plugin.devfile === pluginDevfile && editorDWT.metadata) {
          const isUnmanaged = unmanagedEditors.some(e =>
            editorDWT.metadata?.name?.toLowerCase().includes(e),
          );

          editorDWT.metadata.annotations = {
            [COMPONENT_UPDATE_POLICY]: isUnmanaged ? 'unmanaged' : 'managed',
            [REGISTRY_URL]: plugin.url,
          };
        }
      });
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
            kind: devWorkspaceSingularSubresource,
            name: createdWorkspace.metadata.name,
            uid: createdWorkspace.metadata.uid,
          },
        ];
        this.addEnvVarsToContainers(
          template.spec?.components,
          pluginRegistryUrl,
          pluginRegistryInternalUrl,
          openVSXUrl,
        );

        const pluginDWT = await DwtApi.createTemplate(<devfileApi.DevWorkspaceTemplate>template);
        this.addPlugin(createdWorkspace, pluginDWT.metadata.name, pluginDWT.metadata.namespace);
      }),
    );

    this.addEnvVarsToContainers(
      createdWorkspace.spec.template.components,
      pluginRegistryUrl,
      pluginRegistryInternalUrl,
      openVSXUrl,
    );
    createdWorkspace.spec.started = false;
    const patch = [
      {
        op: 'replace',
        path: '/spec',
        value: createdWorkspace.spec,
      },
    ];
    return DwApi.patchWorkspace(namespace, name, patch);
    await delay();
  }

  /**
   * propagate the plugin registry, plugin internal registry,
   * and dashboard URLs into the components containers
   */
  private addEnvVarsToContainers(
    components:
      | V1alpha2DevWorkspaceSpecTemplateComponents[]
      | V1alpha2DevWorkspaceTemplateSpecComponents[]
      | undefined,
    pluginRegistryUrl: string | undefined,
    pluginRegistryInternalUrl: string | undefined,
    openVSXUrl: string | undefined,
  ): void {
    if (components === undefined) {
      return;
    }

    const dashboardUrl = window.location.origin;

    for (const component of components) {
      const container = component.container;
      if (container === undefined) {
        continue;
      }
      const envs = (container.env || []).filter(
        env =>
          env.name !== this.dashboardUrlEnvName &&
          env.name !== this.pluginRegistryUrlEnvName &&
          env.name !== this.pluginRegistryInternalUrlEnvName &&
          env.name !== this.openVSXUrlEnvName,
      );
      envs.push({
        name: this.dashboardUrlEnvName,
        value: dashboardUrl,
      });
      if (pluginRegistryUrl !== undefined) {
        envs.push({
          name: this.pluginRegistryUrlEnvName,
          value: pluginRegistryUrl,
        });
      }
      if (pluginRegistryInternalUrl !== undefined) {
        envs.push({
          name: this.pluginRegistryInternalUrlEnvName,
          value: pluginRegistryInternalUrl,
        });
      }
      if (openVSXUrl !== undefined) {
        envs.push({
          name: this.openVSXUrlEnvName,
          value: openVSXUrl,
        });
      }
      container.env = envs;
    }
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
   * Called when a DevWorkspace has started.
   *
   * @param workspace The DevWorkspace that was started
   * @param editorId The editor id of the DevWorkspace that was started
   */
  async onStart(
    workspace: devfileApi.DevWorkspace,
    defaultPlugins: WorkspacesDefaultPlugins,
    editorId?: string,
  ) {
    if (editorId) {
      await this.defaultPluginsHandler.handle(workspace, editorId, defaultPlugins);
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

  async updateAnnotation(workspace: devfileApi.DevWorkspace): Promise<devfileApi.DevWorkspace> {
    const patch: api.IPatch = {
      op: 'replace',
      path: '/metadata/annotations',
      value: workspace.metadata.annotations || {},
    };
    return DwApi.patchWorkspace(workspace.metadata.namespace, workspace.metadata.name, [patch]);
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

  async updateConfigData(
    workspace: devfileApi.DevWorkspace,
    config: api.IServerConfig,
  ): Promise<void> {
    const patch: api.IPatch[] = [];
    if (workspace.spec.started) {
      return;
    }
    const cheNamespace = config.cheNamespace;
    if (cheNamespace) {
      const devworkspaceConfig = { name: 'devworkspace-config', namespace: cheNamespace };
      const devworkspaceConfigPath = `/spec/template/attributes/${this.escape(
        DEVWORKSPACE_CONFIG_ANNOTATION,
      )}`;
      if (workspace.spec.template.attributes) {
        if (workspace.spec.template.attributes[DEVWORKSPACE_CONFIG_ANNOTATION]) {
          if (
            workspace.spec.template.attributes[DEVWORKSPACE_CONFIG_ANNOTATION] !==
            devworkspaceConfig
          ) {
            patch.push({ op: 'replace', path: devworkspaceConfigPath, value: devworkspaceConfig });
          }
        } else {
          patch.push({ op: 'add', path: devworkspaceConfigPath, value: devworkspaceConfig });
        }
      } else {
        patch.push({
          op: 'add',
          path: '/spec/template/attributes',
          value: { 'controller.devfile.io/devworkspace-config': devworkspaceConfig },
        });
      }
    }

    const currentPvcStrategy = config.defaults.pvcStrategy;
    if (currentPvcStrategy) {
      const devworkspaceStorageTypePath = `/spec/template/attributes/${this.escape(
        DEVWORKSPACE_STORAGE_TYPE,
      )}`;

      if (workspace.spec.template.attributes) {
        if (!workspace.spec.template.attributes[DEVWORKSPACE_STORAGE_TYPE]) {
          patch.push({ op: 'add', path: devworkspaceStorageTypePath, value: currentPvcStrategy });
        }
      } else {
        patch.push({
          op: 'add',
          path: '/spec/template/attributes',
          value: { 'controller.devfile.io/storage-type': currentPvcStrategy },
        });
      }
    }

    const openVSXURL = config.pluginRegistry.openVSXURL;
    const components = cloneDeep(workspace.spec.template.components);
    if (components) {
      let shouldUpdate = false;
      components.forEach(component => {
        const envs = component.container?.env || [];
        envs.forEach(env => {
          if (env.name === this.openVSXUrlEnvName && env.value !== openVSXURL) {
            shouldUpdate = true;
            env.value = openVSXURL;
          }
        });
      });
      if (shouldUpdate) {
        patch.push({ op: 'replace', path: '/spec/template/components', value: components });
      }
    }

    if (patch.length > 0) {
      await DwApi.patchWorkspace(workspace.metadata.namespace, workspace.metadata.name, patch);
      await delay(800);
    }
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
    if (!skipErrorCheck) {
      this.checkForDevWorkspaceError(changedWorkspace);
    }
    // Need to request DevWorkspace again to get updated Status -- we've patched spec.started
    // but status still may contain an earlier error until DevWorkspace Operator updates it.
    const clusterWorkspace = await DwApi.getWorkspaceByName(
      changedWorkspace.metadata.namespace,
      changedWorkspace.metadata.name,
    );
    return clusterWorkspace;
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
      if (statusUpdate !== undefined) {
        callbacks.updateDevWorkspaceStatus(statusUpdate);
      }
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
      const devworkspaceId = maybeWorkspaceId as string;
      callbacks.updateDeletedDevWorkspaces([devworkspaceId]);
    });
  }

  /**
   * Create a status update between the previously receiving DevWorkspace with a certain workspace id
   * and the new DevWorkspace
   * @param devworkspace The incoming DevWorkspace
   */
  private createStatusUpdate(devworkspace: devfileApi.DevWorkspace): IStatusUpdate | undefined {
    const namespace = devworkspace.metadata.namespace;
    const workspaceUID = WorkspaceAdapter.getUID(devworkspace);
    const phase = devworkspace.status?.phase;
    const status = isDevWorkspaceStatus(phase) ? phase : DevWorkspaceStatus.STARTING;
    const message = devworkspace.status?.message || '';

    if (!this.previousItems.has(namespace)) {
      const defaultItem = new Map<string, IStatusUpdate>();
      this.previousItems.set(namespace, defaultItem);
    }

    const previousItem = this.previousItems.get(namespace);
    const prevStatusUpdate = previousItem?.get(workspaceUID);
    const statusUpdate: IStatusUpdate = {
      status,
      message,
      workspaceUID,
      prevStatus: prevStatusUpdate?.status,
      namespace,
      workspaceId: devworkspace.status?.devworkspaceId,
      mainUrl: devworkspace.status?.mainUrl,
    };

    previousItem?.set(workspaceUID, statusUpdate);

    if (status === prevStatusUpdate?.status && message === prevStatusUpdate?.message) {
      return undefined;
    }

    if (message === prevStatusUpdate?.message) {
      return Object.assign({}, statusUpdate, { message: '' });
    }

    return statusUpdate;
  }

  public checkForDevWorkspaceError(devworkspace: devfileApi.DevWorkspace) {
    const currentPhase = WorkspaceAdapter.getStatus(devworkspace);
    if (currentPhase && currentPhase === DevWorkspaceStatus.FAILED) {
      const message = devworkspace.status?.message;
      if (message) {
        throw new Error(message);
      }
      throw new Error('Unknown error occurred when trying to process the devworkspace');
    }
  }

  async checkForTemplatesUpdate(
    namespace: string,
    pluginsByUrl: { [url: string]: devfileApi.Devfile } = {},
    pluginRegistryUrl: string | undefined,
    pluginRegistryInternalUrl: string | undefined,
    openVSXUrl: string | undefined,
  ): Promise<{ [templateName: string]: api.IPatch[] }> {
    const templates = await DwtApi.getTemplates(namespace);
    const managedTemplates = templates.filter(
      template =>
        template.metadata?.annotations?.[COMPONENT_UPDATE_POLICY] === 'managed' &&
        template.metadata?.annotations?.[REGISTRY_URL],
    );

    const patchByName: { [templateName: string]: api.IPatch[] } = {};

    for (const template of managedTemplates) {
      const url = template.metadata?.annotations?.[REGISTRY_URL];
      let plugin: devfileApi.Devfile | undefined;
      if (pluginsByUrl[url]) {
        plugin = pluginsByUrl[url];
      } else {
        const pluginContent = await fetchData<string>(url);
        plugin = safeLoad(pluginContent) as devfileApi.Devfile;
        pluginsByUrl[url] = plugin;
      }

      const spec: Partial<V1alpha2DevWorkspaceTemplateSpec> = {};
      for (const key in plugin) {
        if (key !== 'schemaVersion' && key !== 'metadata') {
          if (key === 'components') {
            plugin.components?.forEach(component => {
              if (component.container && !component.container.sourceMapping) {
                component.container.sourceMapping = '/projects';
              }
            });
            spec.components = plugin.components;
            this.addEnvVarsToContainers(
              spec.components,
              pluginRegistryUrl,
              pluginRegistryInternalUrl,
              openVSXUrl,
            );
          } else {
            spec[key] = plugin[key];
          }
        }
      }
      if (!isEqual(spec, template.spec)) {
        const patch = {
          op: 'replace',
          path: '/spec',
          value: spec,
        };
        patchByName[template.metadata.name] = [patch];
      }
    }

    return patchByName;
  }

  async updateTemplates(
    namespace: string,
    patchByName: { [templateName: string]: api.IPatch[] },
  ): Promise<void> {
    await Promise.all(
      Object.keys(patchByName).map(name =>
        DwtApi.patchTemplate(namespace, name, patchByName[name]),
      ),
    );
  }
}
