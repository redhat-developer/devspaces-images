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

import { Store } from 'redux';
import common from '@eclipse-che/common';
import { lazyInject } from '../../inversify.config';
import { KeycloakSetupService } from '../keycloak/setup';
import { AppState } from '../../store';
import * as BannerAlertStore from '../../store/BannerAlert';
import * as BrandingStore from '../../store/Branding';
import * as ClusterConfigStore from '../../store/ClusterConfig';
import * as ClusterInfoStore from '../../store/ClusterInfo';
import * as DevfileRegistriesStore from '../../store/DevfileRegistries';
import * as InfrastructureNamespacesStore from '../../store/InfrastructureNamespaces';
import * as PluginsStore from '../../store/Plugins/chePlugins';
import * as DwPluginsStore from '../../store/Plugins/devWorkspacePlugins';
import * as UserProfileStore from '../../store/UserProfile';
import * as UserStore from '../../store/User';
import * as WorkspacesStore from '../../store/Workspaces';
import * as DevWorkspacesStore from '../../store/Workspaces/devWorkspaces';
import * as WorkspacesSettingsStore from '../../store/Workspaces/Settings';
import { ResourceFetcherService } from '../resource-fetcher';
import { IssuesReporterService } from './issuesReporter';
import { CheWorkspaceClient } from '../workspace-client/cheworkspace/cheWorkspaceClient';
import { DevWorkspaceClient } from '../workspace-client/devworkspace/devWorkspaceClient';
import { isDevworkspacesEnabled } from '../helpers/devworkspace';
import { selectDwEditorsPluginsList } from '../../store/Plugins/devWorkspacePlugins/selectors';
import devfileApi from '../devfileApi';
import { selectDefaultNamespace } from '../../store/InfrastructureNamespaces/selectors';
import { selectDevWorkspacesResourceVersion } from '../../store/Workspaces/devWorkspaces/selectors';

/**
 * This class executes a few initial instructions
 * @author Oleksii Orel
 */
export default class Bootstrap {
  @lazyInject(IssuesReporterService)
  private readonly issuesReporterService: IssuesReporterService;

  @lazyInject(KeycloakSetupService)
  private readonly keycloakSetup: KeycloakSetupService;

  @lazyInject(CheWorkspaceClient)
  private readonly cheWorkspaceClient: CheWorkspaceClient;

  @lazyInject(DevWorkspaceClient)
  private readonly devWorkspaceClient: DevWorkspaceClient;

  private store: Store<AppState>;

  constructor(store: Store<AppState>) {
    this.store = store;
  }

  async init(): Promise<void> {
    await this.fetchBranding();
    await this.updateJsonRpcMasterApi();

    new ResourceFetcherService().prefetchResources(this.store.getState());

    const settings = await this.fetchWorkspaceSettings();
    await this.fetchInfrastructureNamespaces();

    const results = await Promise.allSettled([
      this.fetchCurrentUser(),
      this.fetchUserProfile(),
      this.fetchPlugins(settings).then(() => this.fetchDevfileSchema()),
      this.fetchDwPlugins(settings),
      this.fetchDefaultDwPlugins(settings),
      this.fetchRegistriesMetadata(settings),
      this.watchNamespaces(),
      this.updateDevWorkspaceTemplates(settings),
      this.fetchWorkspaces(),
      this.fetchClusterInfo(),
      this.fetchClusterConfig(),
    ]);
    const errors = results
      .filter(result => result.status === 'rejected')
      .map(result => (result as PromiseRejectedResult).reason.toString());
    if (errors.length > 0) {
      throw errors;
    }
  }

  private async fetchClusterConfig(): Promise<void> {
    const { requestClusterConfig } = ClusterConfigStore.actionCreators;
    try {
      await requestClusterConfig()(this.store.dispatch, this.store.getState, undefined);
    } catch (e) {
      console.warn(
        'Unable to fetch cluster configuration. This is expected behavior unless backend is configured to provide this information.',
      );
    }
  }

  private async fetchClusterInfo(): Promise<void> {
    const { requestClusterInfo } = ClusterInfoStore.actionCreators;
    try {
      await requestClusterInfo()(this.store.dispatch, this.store.getState, undefined);
    } catch (e) {
      console.warn(
        'Unable to fetch cluster info. This is expected behavior unless backend is configured to provide this information.',
      );
    }
  }

  private async fetchBranding(): Promise<void> {
    const { requestBranding } = BrandingStore.actionCreators;
    try {
      await requestBranding()(this.store.dispatch, this.store.getState, undefined);
    } catch (e) {
      const errorMessage = common.helpers.errors.getMessage(e);
      this.issuesReporterService.registerIssue('unknown', new Error(errorMessage));
    }
  }

  private async updateJsonRpcMasterApi(): Promise<void> {
    return this.cheWorkspaceClient.updateJsonRpcMasterApi();
  }

  private async watchNamespaces(): Promise<void> {
    const defaultKubernetesNamespace = selectDefaultNamespace(this.store.getState());
    const namespace = defaultKubernetesNamespace.name;
    const { updateDevWorkspaceStatus, updateDeletedDevWorkspaces, updateAddedDevWorkspaces } =
      DevWorkspacesStore.actionCreators;
    const getResourceVersion = async () =>
      selectDevWorkspacesResourceVersion(this.store.getState());
    const dispatch = this.store.dispatch;
    const getState = this.store.getState;
    const callbacks = {
      getResourceVersion,
      updateDevWorkspaceStatus: statusUpdate =>
        updateDevWorkspaceStatus(statusUpdate)(dispatch, getState, undefined),
      updateDeletedDevWorkspaces: workspaceIds =>
        updateDeletedDevWorkspaces(workspaceIds)(dispatch, getState, undefined),
      updateAddedDevWorkspaces: workspaces =>
        updateAddedDevWorkspaces(workspaces)(dispatch, getState, undefined),
    };

    return await this.devWorkspaceClient.subscribeToNamespace({ namespace, callbacks });
  }

  private async fetchCurrentUser(): Promise<void> {
    const { requestUser } = UserStore.actionCreators;
    await requestUser()(this.store.dispatch, this.store.getState, undefined);
  }

  private async fetchWorkspaces(): Promise<void> {
    const { requestWorkspaces } = WorkspacesStore.actionCreators;
    await requestWorkspaces()(this.store.dispatch, this.store.getState, undefined);
  }

  private async fetchPlugins(settings: che.WorkspaceSettings): Promise<void> {
    const { requestPlugins } = PluginsStore.actionCreators;
    await requestPlugins(settings.cheWorkspacePluginRegistryUrl || '')(
      this.store.dispatch,
      this.store.getState,
      undefined,
    );
  }

  private async fetchDwPlugins(settings: che.WorkspaceSettings): Promise<void> {
    if (!isDevworkspacesEnabled(settings)) {
      return;
    }
    const { requestDwDefaultEditor } = DwPluginsStore.actionCreators;
    try {
      await requestDwDefaultEditor(settings)(this.store.dispatch, this.store.getState, undefined);
    } catch (e) {
      const message = `Required sources failed when trying to create the workspace: ${e}`;
      const { addBanner } = BannerAlertStore.actionCreators;
      addBanner(message)(this.store.dispatch, this.store.getState, undefined);

      throw e;
    }
  }

  private async fetchDefaultDwPlugins(settings: che.WorkspaceSettings): Promise<void> {
    if (!isDevworkspacesEnabled(settings)) {
      return;
    }
    const { requestDwDefaultPlugins } = DwPluginsStore.actionCreators;
    try {
      await requestDwDefaultPlugins()(this.store.dispatch, this.store.getState, undefined);
    } catch (e) {
      console.error('Failed to retrieve default plug-ins.', e);
    }
  }

  private async updateDevWorkspaceTemplates(settings: che.WorkspaceSettings): Promise<void> {
    if (!isDevworkspacesEnabled(settings)) {
      return;
    }
    const defaultKubernetesNamespace = selectDefaultNamespace(this.store.getState());
    const defaultNamespace = defaultKubernetesNamespace.name;
    try {
      const pluginsByUrl: { [url: string]: devfileApi.Devfile } = {};
      const state = this.store.getState();
      selectDwEditorsPluginsList(state.dwPlugins.defaultEditorName)(state).forEach(dwEditor => {
        pluginsByUrl[dwEditor.url] = dwEditor.devfile;
      });
      const updates = await this.devWorkspaceClient.checkForTemplatesUpdate(
        defaultNamespace,
        pluginsByUrl,
      );
      if (Object.keys(updates).length > 0) {
        await this.devWorkspaceClient.updateTemplates(defaultNamespace, updates);
      }
    } catch (e) {
      console.error('Failed to update templates.', e);
    }
  }

  private async fetchInfrastructureNamespaces(): Promise<void> {
    const { requestNamespaces } = InfrastructureNamespacesStore.actionCreators;
    await requestNamespaces()(this.store.dispatch, this.store.getState, undefined);
  }

  private async fetchWorkspaceSettings(): Promise<che.WorkspaceSettings> {
    const { requestSettings } = WorkspacesSettingsStore.actionCreators;
    try {
      await requestSettings()(this.store.dispatch, this.store.getState, undefined);
    } catch (e) {
      // noop
    }

    return this.store.getState().workspacesSettings.settings;
  }

  private async fetchRegistriesMetadata(settings: che.WorkspaceSettings): Promise<void> {
    const { requestRegistriesMetadata } = DevfileRegistriesStore.actionCreators;
    await requestRegistriesMetadata(settings.cheWorkspaceDevfileRegistryUrl || '')(
      this.store.dispatch,
      this.store.getState,
      undefined,
    );
  }

  private async fetchDevfileSchema(): Promise<void> {
    const { requestJsonSchema } = DevfileRegistriesStore.actionCreators;
    return requestJsonSchema()(this.store.dispatch, this.store.getState, undefined);
  }

  private async fetchUserProfile(): Promise<void> {
    const { requestUserProfile } = UserProfileStore.actionCreators;
    return requestUserProfile()(this.store.dispatch, this.store.getState, undefined);
  }
}
