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

import { ApplicationId } from '@eclipse-che/common';

import { container } from '@/inversify.config';
import * as DwtApi from '@/services/backend-client/devWorkspaceTemplateApi';
import devfileApi from '@/services/devfileApi';
import { DevWorkspaceClient } from '@/services/workspace-client/devworkspace/devWorkspaceClient';
import { AppState } from '@/store';
import { selectApplications } from '@/store/ClusterInfo/selectors';
import { selectDefaultNamespace } from '@/store/InfrastructureNamespaces/selectors';
import { selectDwEditorsPluginsList } from '@/store/Plugins/devWorkspacePlugins/selectors';
import {
  selectOpenVSXUrl,
  selectPluginRegistryInternalUrl,
  selectPluginRegistryUrl,
} from '@/store/ServerConfig/selectors';

const devWorkspaceClient = container.get(DevWorkspaceClient);

export async function updateEditor(editorName: string, getState: () => AppState): Promise<void> {
  const state = getState();
  const namespace = selectDefaultNamespace(state).name;
  const pluginsByUrl: { [url: string]: devfileApi.Devfile } = {};
  selectDwEditorsPluginsList(state.dwPlugins.defaultEditorName)(state).forEach(dwEditor => {
    pluginsByUrl[dwEditor.url] = dwEditor.devfile;
  });
  const editors = state.dwPlugins.cmEditors || [];
  const openVSXUrl = selectOpenVSXUrl(state);
  const pluginRegistryUrl = selectPluginRegistryUrl(state);
  const pluginRegistryInternalUrl = selectPluginRegistryInternalUrl(state);
  const clusterConsole = selectApplications(state).find(
    app => app.id === ApplicationId.CLUSTER_CONSOLE,
  );

  try {
    const updates = await devWorkspaceClient.checkForTemplatesUpdate(
      editorName,
      namespace,
      editors,
      pluginRegistryUrl,
      pluginRegistryInternalUrl,
      openVSXUrl,
      clusterConsole,
    );
    if (updates.length > 0) {
      await DwtApi.patchTemplate(namespace, editorName, updates);
    }
  } catch (e) {
    console.error(e);
  }
}

export function getEditorName(workspace: devfileApi.DevWorkspace): string | undefined {
  const contributions = workspace.spec?.contributions;
  if (!contributions || contributions.length === 0) {
    return undefined;
  }
  let editorName: string | undefined = undefined;

  for (const contribution of contributions) {
    if (contribution.name === 'editor' && contribution.kubernetes?.name) {
      editorName = contribution.kubernetes.name;
      break;
    }
  }

  return editorName;
}

export function getLifeTimeMs(workspace: devfileApi.DevWorkspace): number {
  const creationTimestamp = workspace.metadata.creationTimestamp;
  if (creationTimestamp === undefined) {
    return 0;
  }

  return new Date().getTime() - new Date(creationTimestamp).getTime();
}
