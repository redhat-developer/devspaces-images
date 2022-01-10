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

import * as DwApi from '../../dashboard-backend-client/devWorkspaceApi';
import devfileApi from '../../devfileApi';
import { api } from '@eclipse-che/common';
import { createHash } from 'crypto';
import { injectable } from 'inversify';
import { V1alpha2DevWorkspaceSpecTemplateComponents } from '@devfile/api';
import { WorkspacesDefaultPlugins } from 'dashboard-frontend/src/store/Plugins/devWorkspacePlugins';

const DEFAULT_PLUGIN_ATTRIBUTE = 'che.eclipse.org/default-plugin';

/**
 * This class manages the default plugins defined in
 * the DevWorkspace's spec.template.components array.
 */
@injectable()
export class DevWorkspaceDefaultPluginsHandler {
  public async handle(
    workspace: devfileApi.DevWorkspace,
    editorId: string,
    defaultPlugins: WorkspacesDefaultPlugins,
  ): Promise<void> {
    if (!defaultPlugins[editorId]) {
      return;
    }

    const componentsUpdated = this.handleUriPlugins(workspace, defaultPlugins[editorId]);
    if (componentsUpdated) {
      this.patchWorkspaceComponents(workspace);
    }
  }

  /**
   * Manages the default uri plugins from the devworkspace's spec.template.components
   * @param workspace A devworkspace to manage default plugins for
   * @param defaultPlugins The set of current default plugins uris
   * @returns true if the devworkspace's spec.template.components has been updated
   */
  private handleUriPlugins(workspace: devfileApi.DevWorkspace, defaultPlugins: string[]): boolean {
    const defaultUriPlugins = new Set(
      defaultPlugins.filter(plugin => {
        if (this.isUri(plugin)) {
          return true;
        }
        console.log(`Default plugin ${plugin} is not a uri. Ignoring.`);
        return false;
      }),
    );

    let componentsUpdated = this.removeOldDefaultUriPlugins(workspace, defaultUriPlugins);
    defaultUriPlugins.forEach(plugin => {
      const hash = createHash('MD5').update(plugin).digest('hex').substring(0, 20).toLowerCase();
      const added = this.addDefaultPluginByUri(workspace, 'default-' + hash, plugin);
      componentsUpdated = added || componentsUpdated;
    });

    return componentsUpdated;
  }

  private isUri(str: string): boolean {
    try {
      new URL(str);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Checks if there are default plugins in the workspace that are not
   * specified in defaultUriPlugins. If such plugins are found, this function
   * removes them.
   * @param workspace A devworkspace to remove old default plugins for
   * @param defaultUriPlugins The set of current default plugins
   * @returns true if a plugin has been removed, false otherwise
   */
  private removeOldDefaultUriPlugins(
    workspace: devfileApi.DevWorkspace,
    defaultUriPlugins: Set<string>,
  ): boolean {
    if (!workspace.spec.template.components) {
      return false;
    }

    const components = workspace.spec.template.components.filter(component => {
      if (!this.isDefaultPluginComponent(component) || !component.plugin?.uri) {
        // component is not a default uri plugin, keep component.
        return true;
      }
      return defaultUriPlugins.has(component.plugin.uri);
    });

    const removed = workspace.spec.template.components.length !== components.length;
    workspace.spec.template.components = components;
    return removed;
  }

  /**
   * Returns true if component is a default plugin managed by this class
   * @param component The component to check
   * @returns true if component is a default plugin managed by this class
   */
  private isDefaultPluginComponent(component: V1alpha2DevWorkspaceSpecTemplateComponents): boolean {
    return component.attributes && component.attributes[DEFAULT_PLUGIN_ATTRIBUTE]
      ? component.attributes[DEFAULT_PLUGIN_ATTRIBUTE].toString() === 'true'
      : false;
  }

  /**
   * Adds a default plugin to the workspace by uri if the default plugin does not
   * already exist
   * @param workspace A devworkspace
   * @param pluginName The name of the plugin
   * @param pluginUri The uri of the plugin
   * @returns true if the default plugin has been added
   */
  private addDefaultPluginByUri(
    workspace: devfileApi.DevWorkspace,
    pluginName: string,
    pluginUri: string,
  ): boolean {
    if (!workspace.spec.template.components) {
      workspace.spec.template.components = [];
    }

    if (workspace.spec.template.components.find(component => component.name === pluginName)) {
      // plugin already exists
      return false;
    }

    workspace.spec.template.components.push({
      name: pluginName,
      attributes: { [DEFAULT_PLUGIN_ATTRIBUTE]: true },
      plugin: { uri: pluginUri },
    });
    return true;
  }

  private async patchWorkspaceComponents(workspace: devfileApi.DevWorkspace) {
    const patch: api.IPatch[] = [
      {
        op: 'replace',
        path: '/spec/template/components',
        value: workspace.spec.template.components,
      },
    ];
    return DwApi.patchWorkspace(workspace.metadata.namespace, workspace.metadata.name, patch);
  }
}
