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

import {
  V1alpha2DevWorkspaceSpecContributions,
  V1alpha2DevWorkspaceSpecTemplateComponents,
} from '@devfile/api';
import { api } from '@eclipse-che/common';
import { createHash } from 'crypto';
import { injectable } from 'inversify';

import * as DwApi from '@/services/backend-client/devWorkspaceApi';
import devfileApi from '@/services/devfileApi';
import { DevWorkspacePlugin } from '@/services/devfileApi/devWorkspace';
import { WorkspacesDefaultPlugins } from '@/store/Plugins/devWorkspacePlugins';

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
    const componentsUpdated = this.removeDefaultUriPluginsComponents(workspace);
    const contributionsUpdated = this.handleUriPlugins(workspace, defaultPlugins[editorId]);
    if (componentsUpdated) {
      await this.patchWorkspaceComponents(workspace);
    }
    if (contributionsUpdated) {
      await this.patchWorkspaceContributions(workspace);
    }
  }

  /**
   * Manages the default uri plugins from the devworkspace's spec.template.components
   * @param workspace A devworkspace to manage default plugins for
   * @param defaultPlugins The set of current default plugins uris
   * @returns true if the devworkspace's spec.contributions has been updated
   */
  private handleUriPlugins(
    workspace: devfileApi.DevWorkspace,
    defaultPlugins: string[] = [],
  ): boolean {
    const defaultUriPlugins = new Set(
      defaultPlugins.filter(plugin => {
        if (this.isUri(plugin)) {
          return true;
        }
        console.log(`Default plugin ${plugin} is not a uri. Ignoring.`);
        return false;
      }),
    );

    let contributionsUpdated = this.removeDefaultUriPlugins(workspace, defaultUriPlugins);

    defaultUriPlugins.forEach(plugin => {
      const hash = createHash('MD5').update(plugin).digest('hex').substring(0, 20).toLowerCase();
      const added = this.addDefaultPluginByUri(workspace, 'default-' + hash, plugin);
      contributionsUpdated = added || contributionsUpdated;
    });

    return contributionsUpdated;
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
   * Removes all default uri plugins in spec.template.components since they should now
   * be defined in spec.contributions
   * @param workspace workspace to remove old default plugins for
   * @returns true if a default plugin has been removed, false otherwise
   */
  private removeDefaultUriPluginsComponents(workspace: devfileApi.DevWorkspace): boolean {
    if (!workspace.spec.template.components) {
      return false;
    }
    const components = workspace.spec.template.components.filter(component => {
      const isNotUrlPlugin = !component.plugin?.uri;
      return !this.isDefaultPluginComponent(component) || isNotUrlPlugin;
    });
    const removed = workspace.spec.template.components.length !== components.length;
    workspace.spec.template.components = components;
    return removed;
  }

  /**
   * Removes all default uri plugins in the workspace except for plugins with
   * uris specified in the allowlist.
   * @param workspace A devworkspace to remove old default plugins for
   * @param allowlist The set of uris to not remove
   * @returns true if a default plugin has been removed, false otherwise
   */
  private removeDefaultUriPlugins(
    workspace: devfileApi.DevWorkspace,
    allowlist: Set<string> = new Set(),
  ): boolean {
    if (!workspace.spec.contributions) {
      return false;
    }

    const contributions = workspace.spec.contributions?.filter(contribution => {
      if (!this.isDefaultPluginContribution(contribution) || !contribution.uri) {
        // component is not a default uri plugin, keep component.
        return true;
      }
      return allowlist.has(contribution.uri);
    }) as DevWorkspacePlugin[];

    const removed = workspace.spec.contributions.length !== contributions.length;
    workspace.spec.contributions = contributions;
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
   * Returns true if provided contribution is a default plugin managed by this class
   * @param contribution The contribution to check
   * @returns true if contribution is a default plugin managed by this class
   */
  private isDefaultPluginContribution(
    contribution: V1alpha2DevWorkspaceSpecContributions,
  ): boolean {
    return contribution.attributes && contribution.attributes[DEFAULT_PLUGIN_ATTRIBUTE]
      ? contribution.attributes[DEFAULT_PLUGIN_ATTRIBUTE].toString() === 'true'
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
    if (!workspace.spec.contributions) {
      workspace.spec.contributions = [];
    }

    if (
      workspace.spec.contributions.find(contribution => {
        return this.isDefaultPluginContribution(contribution) && contribution.uri === pluginUri;
      })
    ) {
      // plugin already exists
      return false;
    }

    workspace.spec.contributions.push({
      name: pluginName,
      attributes: { [DEFAULT_PLUGIN_ATTRIBUTE]: true },
      uri: pluginUri,
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

  private async patchWorkspaceContributions(workspace: devfileApi.DevWorkspace) {
    const patch: api.IPatch[] = [
      {
        op: 'replace',
        path: '/spec/contributions',
        value: workspace.spec.contributions,
      },
    ];
    return DwApi.patchWorkspace(workspace.metadata.namespace, workspace.metadata.name, patch);
  }
}
