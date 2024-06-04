/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import {
  V1alpha2DevWorkspaceSpecTemplateComponents,
  V1alpha2DevWorkspaceTemplateSpec,
  V1alpha2DevWorkspaceTemplateSpecComponents,
  V222DevfileComponentsItemsContainer,
} from '@devfile/api';
import { api } from '@eclipse-che/common';
import { inject, injectable } from 'inversify';
import { cloneDeep, isEqual } from 'lodash';

import * as DwApi from '@/services/backend-client/devWorkspaceApi';
import * as DwtApi from '@/services/backend-client/devWorkspaceTemplateApi';
import devfileApi from '@/services/devfileApi';
import { DevWorkspacePlugin } from '@/services/devfileApi/devWorkspace';
import {
  DEVWORKSPACE_CHE_EDITOR,
  DEVWORKSPACE_UPDATING_TIMESTAMP_ANNOTATION,
} from '@/services/devfileApi/devWorkspace/metadata';
import {
  DEVWORKSPACE_CONFIG_ATTR,
  DEVWORKSPACE_CONTAINER_BUILD_ATTR,
  DEVWORKSPACE_STORAGE_TYPE_ATTR,
} from '@/services/devfileApi/devWorkspace/spec/template';
import { delay } from '@/services/helpers/delay';
import { isWebTerminal } from '@/services/helpers/devworkspace';
import { DevWorkspaceStatus } from '@/services/helpers/types';
import { WorkspaceAdapter } from '@/services/workspace-adapter';
import {
  devWorkspaceApiGroup,
  devWorkspaceSingularSubresource,
  devWorkspaceVersion,
} from '@/services/workspace-client/devworkspace/converters';
import { DevWorkspaceDefaultPluginsHandler } from '@/services/workspace-client/devworkspace/DevWorkspaceDefaultPluginsHandler';
import { WorkspacesDefaultPlugins } from '@/store/Plugins/devWorkspacePlugins';

export const COMPONENT_UPDATE_POLICY = 'che.eclipse.org/components-update-policy';
export const REGISTRY_URL = 'che.eclipse.org/plugin-registry-url';

export const DEVWORKSPACE_NEXT_START_ANNOTATION = 'che.eclipse.org/next-start-cfg';

export const DEVWORKSPACE_DEBUG_START_ANNOTATION = 'controller.devfile.io/debug-start';

export const DEVWORKSPACE_DEVFILE_SOURCE = 'che.eclipse.org/devfile-source';

export const DEVWORKSPACE_DEVFILE = 'che.eclipse.org/devfile';

export const DEVWORKSPACE_METADATA_ANNOTATION = 'dw.metadata.annotations';

export interface ICheEditorOverrideContainer extends V222DevfileComponentsItemsContainer {
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
export class DevWorkspaceClient {
  private readonly maxStatusAttempts: number;
  private readonly pluginRegistryUrlEnvName: string;
  private readonly pluginRegistryInternalUrlEnvName: string;
  private readonly clusterConsoleUrlEnvName: string;
  private readonly clusterConsoleTitleEnvName: string;
  private readonly openVSXUrlEnvName: string;
  private readonly dashboardUrlEnvName: string;
  private readonly defaultPluginsHandler: DevWorkspaceDefaultPluginsHandler;

  constructor(
    @inject(DevWorkspaceDefaultPluginsHandler)
    defaultPluginsHandler: DevWorkspaceDefaultPluginsHandler,
  ) {
    this.maxStatusAttempts = 10;
    this.pluginRegistryUrlEnvName = 'CHE_PLUGIN_REGISTRY_URL';
    this.pluginRegistryInternalUrlEnvName = 'CHE_PLUGIN_REGISTRY_INTERNAL_URL';
    this.openVSXUrlEnvName = 'OPENVSX_REGISTRY_URL';
    this.dashboardUrlEnvName = 'CHE_DASHBOARD_URL';
    this.clusterConsoleUrlEnvName = 'CLUSTER_CONSOLE_URL';
    this.clusterConsoleTitleEnvName = 'CLUSTER_CONSOLE_TITLE';
    this.defaultPluginsHandler = defaultPluginsHandler;
  }

  async getAllWorkspaces(
    defaultNamespace: string,
  ): Promise<{ workspaces: devfileApi.DevWorkspace[]; resourceVersion: string }> {
    const listWorkspaces = await DwApi.listWorkspacesInNamespace(defaultNamespace);
    const {
      items,
      metadata: { resourceVersion },
    } = listWorkspaces?.metadata
      ? listWorkspaces
      : { items: [], metadata: { resourceVersion: '' } };
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
    let attempt = 0;
    while (!workspace.status?.phase && attempt < this.maxStatusAttempts) {
      if (attempt > 0) {
        await delay();
      }
      workspace = await DwApi.getWorkspaceByName(namespace, workspaceName);
      attempt++;
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

  async createDevWorkspace(
    defaultNamespace: string,
    devWorkspaceResource: devfileApi.DevWorkspace,
    editorId: string | undefined,
  ): Promise<{ headers: DwApi.Headers; devWorkspace: devfileApi.DevWorkspace }> {
    if (!devWorkspaceResource.spec.routingClass) {
      devWorkspaceResource.spec.routingClass = 'che';
    }
    devWorkspaceResource.spec.started = false;
    devWorkspaceResource.metadata.namespace = defaultNamespace;

    if (!devWorkspaceResource.metadata.annotations) {
      devWorkspaceResource.metadata.annotations = {};
    }

    devWorkspaceResource.metadata.annotations[DEVWORKSPACE_UPDATING_TIMESTAMP_ANNOTATION] =
      new Date().toISOString();

    if (editorId) {
      devWorkspaceResource.metadata.annotations[DEVWORKSPACE_CHE_EDITOR] = editorId;
    }

    const { headers, devWorkspace } = await DwApi.createWorkspace(devWorkspaceResource);

    return { headers, devWorkspace };
  }

  async createDevWorkspaceTemplate(
    defaultNamespace: string,
    devWorkspace: devfileApi.DevWorkspace,
    devWorkspaceTemplateResource: devfileApi.DevWorkspaceTemplate,
    pluginRegistryUrl: string | undefined,
    pluginRegistryInternalUrl: string | undefined,
    openVSXUrl: string | undefined,
    clusterConsole?: {
      url: string;
      title: string;
    },
  ): Promise<devfileApi.DevWorkspaceTemplate> {
    devWorkspaceTemplateResource.metadata.namespace = defaultNamespace;

    // add owner reference (to allow automatic cleanup)
    devWorkspaceTemplateResource.metadata.ownerReferences = [
      {
        apiVersion: `${devWorkspaceApiGroup}/${devWorkspaceVersion}`,
        kind: devWorkspaceSingularSubresource,
        name: devWorkspace.metadata.name,
        uid: devWorkspace.metadata.uid,
      },
    ];

    this.addEnvVarsToContainers(
      devWorkspaceTemplateResource.spec?.components,
      pluginRegistryUrl,
      pluginRegistryInternalUrl,
      openVSXUrl,
      clusterConsole,
    );

    return DwtApi.createTemplate(devWorkspaceTemplateResource);
  }

  async updateDevWorkspace(
    devWorkspace: devfileApi.DevWorkspace,
  ): Promise<{ headers: DwApi.Headers; devWorkspace: devfileApi.DevWorkspace }> {
    return await DwApi.patchWorkspace(devWorkspace.metadata.namespace, devWorkspace.metadata.name, [
      {
        op: 'replace',
        path: '/spec/template/components',
        value: devWorkspace.spec.template.components,
      },
    ]);
  }

  /**
   * propagate the plugin registry, plugin internal registry,
   * and dashboard URLs into the components containers
   */
  public addEnvVarsToContainers(
    components:
      | V1alpha2DevWorkspaceSpecTemplateComponents[]
      | V1alpha2DevWorkspaceTemplateSpecComponents[]
      | undefined,
    pluginRegistryUrl: string | undefined,
    pluginRegistryInternalUrl: string | undefined,
    openVSXUrl: string | undefined,
    clusterConsole?: {
      url: string;
      title: string;
    },
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
          env.name !== this.clusterConsoleUrlEnvName &&
          env.name !== this.clusterConsoleTitleEnvName &&
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
      if (clusterConsole?.url !== undefined) {
        envs.push({
          name: this.clusterConsoleUrlEnvName,
          value: clusterConsole.url,
        });
      }
      if (clusterConsole?.title !== undefined) {
        envs.push({
          name: this.clusterConsoleTitleEnvName,
          value: clusterConsole.title,
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

    const { devWorkspace } = await DwApi.patchWorkspace(namespace, name, patch);
    return devWorkspace;
  }

  async updateAnnotation(workspace: devfileApi.DevWorkspace): Promise<devfileApi.DevWorkspace> {
    const patch: api.IPatch = {
      op: 'replace',
      path: '/metadata/annotations',
      value: workspace.metadata.annotations || {},
    };
    const { devWorkspace } = await DwApi.patchWorkspace(
      workspace.metadata.namespace,
      workspace.metadata.name,
      [patch],
    );
    return devWorkspace;
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

  async managePvcStrategy(
    workspace: devfileApi.DevWorkspace,
    config: api.IServerConfig,
  ): Promise<devfileApi.DevWorkspace> {
    const patch: api.IPatch[] = [];
    const cheNamespace = config.cheNamespace;
    let attributes = workspace.spec.template.attributes;
    if (cheNamespace) {
      const devworkspaceConfig = { name: 'devworkspace-config', namespace: cheNamespace };
      const devworkspaceConfigPath = `/spec/template/attributes/${this.escape(
        DEVWORKSPACE_CONFIG_ATTR,
      )}`;
      if (attributes) {
        if (!attributes[DEVWORKSPACE_CONFIG_ATTR]) {
          patch.push({ op: 'add', path: devworkspaceConfigPath, value: devworkspaceConfig });
        }
      } else {
        patch.push({
          op: 'add',
          path: '/spec/template/attributes',
          value: { [DEVWORKSPACE_CONFIG_ATTR]: devworkspaceConfig },
        });
        attributes = {};
      }
    }

    const currentPvcStrategy = config.defaults.pvcStrategy;
    if (currentPvcStrategy) {
      const devworkspaceStorageTypePath = `/spec/template/attributes/${this.escape(
        DEVWORKSPACE_STORAGE_TYPE_ATTR,
      )}`;

      if (attributes) {
        if (!attributes[DEVWORKSPACE_STORAGE_TYPE_ATTR]) {
          patch.push({ op: 'add', path: devworkspaceStorageTypePath, value: currentPvcStrategy });
        }
      } else {
        patch.push({
          op: 'add',
          path: '/spec/template/attributes',
          value: { [DEVWORKSPACE_STORAGE_TYPE_ATTR]: currentPvcStrategy },
        });
        attributes = {};
      }
    }

    const openVSXURL = config.pluginRegistry?.openVSXURL || '';
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

    if (patch.length === 0) {
      return workspace;
    }
    const { devWorkspace } = await DwApi.patchWorkspace(
      workspace.metadata.namespace,
      workspace.metadata.name,
      patch,
    );
    return devWorkspace;
  }

  async manageDebugMode(
    workspace: devfileApi.DevWorkspace,
    debugMode: boolean,
  ): Promise<devfileApi.DevWorkspace> {
    const patch: api.IPatch[] = [];
    const currentDebugMode = this.getDebugMode(workspace);
    if (currentDebugMode !== debugMode) {
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
    }

    if (patch.length === 0) {
      return workspace;
    }
    const { devWorkspace } = await DwApi.patchWorkspace(
      workspace.metadata.namespace,
      workspace.metadata.name,
      patch,
    );
    return devWorkspace;
  }

  /**
   * Injects or removes the container build attribute depending on the CR `disableContainerBuildCapabilities` field value.
   */
  async manageContainerBuildAttribute(
    workspace: devfileApi.DevWorkspace,
    config: api.IServerConfig,
  ): Promise<devfileApi.DevWorkspace> {
    const patch: api.IPatch[] = [];
    if (config.containerBuild.disableContainerBuildCapabilities) {
      if (workspace.spec.template.attributes?.[DEVWORKSPACE_CONTAINER_BUILD_ATTR]) {
        // remove the attribute
        const path = `/spec/template/attributes/${this.escape(DEVWORKSPACE_CONTAINER_BUILD_ATTR)}`;
        patch.push({ op: 'remove', path });
      }
    } else if (
      !config.containerBuild.containerBuildConfiguration?.openShiftSecurityContextConstraint
    ) {
      console.warn(
        'Skip injecting the container build attribute: "openShiftSecurityContextConstraint" is undefined',
      );
    } else {
      // add the attribute
      if (!workspace.spec.template.attributes) {
        const path = '/spec/template/attributes';
        const value = {
          [DEVWORKSPACE_CONTAINER_BUILD_ATTR]:
            config.containerBuild.containerBuildConfiguration.openShiftSecurityContextConstraint,
        };
        patch.push({ op: 'add', path, value });
      } else {
        const path = `/spec/template/attributes/${this.escape(DEVWORKSPACE_CONTAINER_BUILD_ATTR)}`;
        const value =
          config.containerBuild.containerBuildConfiguration.openShiftSecurityContextConstraint;
        patch.push({ op: 'add', path, value });
      }
    }

    if (patch.length === 0) {
      return workspace;
    }
    const { devWorkspace } = await DwApi.patchWorkspace(
      workspace.metadata.namespace,
      workspace.metadata.name,
      patch,
    );
    return devWorkspace;
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

    let { devWorkspace } = await DwApi.patchWorkspace(
      workspace.metadata.namespace,
      workspace.metadata.name,
      patch,
    );
    if (!skipErrorCheck) {
      const currentPhase = WorkspaceAdapter.getStatus(devWorkspace);
      // Need to request DevWorkspace again to get updated Status -- we've patched spec.started
      // but status still may contain an earlier error until DevWorkspace Operator updates it.
      if (currentPhase === DevWorkspaceStatus.FAILED) {
        devWorkspace = await DwApi.getWorkspaceByName(
          devWorkspace.metadata.namespace,
          devWorkspace.metadata.name,
        );
      }
      this.checkForDevWorkspaceError(devWorkspace);
    }

    return devWorkspace;
  }

  /**
   * Add the plugin to the workspace
   * @param workspace A devworkspace
   * @param pluginName The name of the plugin
   * @param namespace A namespace
   */
  private addPlugin(workspace: devfileApi.DevWorkspace, pluginName: string, namespace: string) {
    if (!workspace.spec.contributions) {
      workspace.spec.contributions = [];
    }
    const contributions = workspace.spec.contributions.filter(
      contribution => contribution.name !== pluginName,
    ) as DevWorkspacePlugin[];
    contributions.push({
      name: pluginName,
      kubernetes: {
        name: pluginName,
        namespace,
      },
    });
    workspace.spec.contributions = contributions;
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
    editorName: string,
    namespace: string,
    editors: devfileApi.Devfile[],
    pluginRegistryUrl: string | undefined,
    pluginRegistryInternalUrl: string | undefined,
    openVSXUrl: string | undefined,
    clusterConsole?: {
      url: string;
      title: string;
    },
  ): Promise<api.IPatch[]> {
    const managedTemplate = await DwtApi.getTemplateByName(namespace, editorName);

    const patch: api.IPatch[] = [];

    let editorReference = managedTemplate.metadata?.annotations?.[REGISTRY_URL];

    if (
      !editorReference ||
      managedTemplate.metadata?.annotations?.[COMPONENT_UPDATE_POLICY] !== 'managed'
    ) {
      console.log('Template is not managed');
      return patch;
    }

    if (/^(https?:\/\/)/.test(editorReference)) {
      // Define a regular expression pattern to match URLs containing 'plugin-registry/v3/plugins'
      // and ending with 'devfile.yaml'. The part between 'v3/plugins/' and '/devfile.yaml' is captured.
      const pluginRegistryURLPattern = /plugin-registry\/v3\/plugins\/(.+?)\/devfile\.yaml$/;
      const match = editorReference.match(pluginRegistryURLPattern);

      if (match) {
        editorReference = match[1];
        const annotations = {
          [COMPONENT_UPDATE_POLICY]: 'managed',
          [REGISTRY_URL]: editorReference,
        };
        // Create a patch to update the annotations by replacing plugin registry URL with the editor reference
        patch.push({
          op: 'replace',
          path: '/metadata/annotations',
          value: annotations,
        });
      } else {
        console.log('Template is not managed');
        return patch;
      }
    }

    const originalEditor: devfileApi.Devfile | undefined = editors.find(editor => {
      return (
        editor.metadata?.attributes?.publisher +
          '/' +
          editor.metadata?.name +
          '/' +
          editor.metadata?.attributes?.version ===
        editorReference
      );
    });
    if (!originalEditor) {
      return patch;
    }

    const spec: Partial<V1alpha2DevWorkspaceTemplateSpec> = {};
    for (const key in originalEditor) {
      if (key !== 'schemaVersion' && key !== 'metadata') {
        if (key === 'components') {
          originalEditor.components?.forEach(component => {
            if (component.container && !component.container.sourceMapping) {
              component.container.sourceMapping = '/projects';
            }
          });
          spec.components = originalEditor.components;
          this.addEnvVarsToContainers(
            spec.components,
            pluginRegistryUrl,
            pluginRegistryInternalUrl,
            openVSXUrl,
            clusterConsole,
          );
        } else {
          spec[key] = originalEditor[key];
        }
      }
    }
    if (!isEqual(spec, managedTemplate.spec)) {
      patch.push({
        op: 'replace',
        path: '/spec',
        value: spec,
      });
    }

    return patch;
  }
}
