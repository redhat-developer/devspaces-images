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
import { lazyInject } from '../../inversify.config';
import { KeycloakSetupService } from '../keycloak/setup';
import { AppState } from '../../store';
import * as BrandingStore from '../../store/Branding';
import * as DevfileRegistriesStore from '../../store/DevfileRegistries';
import * as InfrastructureNamespacesStore from '../../store/InfrastructureNamespaces';
import * as Plugins from '../../store/Plugins/chePlugins';
import * as DwPlugins from '../../store/Plugins/devWorkspacePlugins';
import * as UserProfileStore from '../../store/UserProfile';
import * as UserStore from '../../store/User';
import * as WorkspacesStore from '../../store/Workspaces';
import * as DevWorkspacesStore from '../../store/Workspaces/devWorkspaces';
import * as WorkspacesSettingsStore from '../../store/Workspaces/Settings';
import { ResourceFetcherService } from '../resource-fetcher';
import { IssuesReporterService } from './issuesReporter';
import { CheWorkspaceClient } from '../workspace-client/cheWorkspaceClient';
import { DevWorkspaceClient } from '../workspace-client/devWorkspaceClient';

/**
 * This class prepares all init data.
 * @author Oleksii Orel
 */
export class PreloadData {

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

    const results = await Promise.allSettled([
      this.fetchCurrentUser(),
      this.fetchInfrastructureNamespaces(),
      this.fetchUserProfile(),
      this.fetchPlugins(settings),
      this.fetchDwPlugins(settings),
      this.fetchRegistriesMetadata(settings),
      this.fetchDevfileSchema(),
      this.fetchWorkspaces(),
    ]);
    const errors = results
      .filter(result => result.status === 'rejected')
      .map(result => (result as PromiseRejectedResult).reason.toString());
    if (errors.length > 0) {
      throw errors;
    }
  }

  private async fetchBranding(): Promise<void> {
    const { requestBranding } = BrandingStore.actionCreators;
    try {
      await requestBranding()(this.store.dispatch, this.store.getState, undefined);
    } catch (e) {
      this.issuesReporterService.registerIssue('unknown', new Error(e));
    }
  }

  private async updateJsonRpcMasterApi(): Promise<void> {
    return this.cheWorkspaceClient.updateJsonRpcMasterApi();
  }

  private async initializeNamespace(namespace: string): Promise<boolean> {
    return this.devWorkspaceClient.initializeNamespace(namespace);
  }

  private async watchNamespaces(namespace: string): Promise<void> {
    const { updateDevWorkspaceStatus, updateDeletedDevWorkspaces, updateAddedDevWorkspaces } = DevWorkspacesStore.actionCreators;
    const callbacks = { updateDevWorkspaceStatus, updateDeletedDevWorkspaces, updateAddedDevWorkspaces };
    return this.devWorkspaceClient.subscribeToNamespace(namespace, callbacks, this.store.dispatch, this.store.getState);
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
    const { requestPlugins } = Plugins.actionCreators;
    await requestPlugins(settings.cheWorkspacePluginRegistryUrl || '')(this.store.dispatch, this.store.getState, undefined);
  }

  private async fetchDwPlugins(settings: che.WorkspaceSettings): Promise<void> {
    if (settings['che.devworkspaces.enabled'] !== 'true') {
      return;
    }

    const defaultNamespace = await this.cheWorkspaceClient.getDefaultNamespace();
    const namespaceInitialized = await this.initializeNamespace(defaultNamespace);
    if (namespaceInitialized) {
      this.watchNamespaces(defaultNamespace);
    }

    const { requestDwDevfiles } = DwPlugins.actionCreators;
    await requestDwDevfiles(`${settings.cheWorkspacePluginRegistryUrl}/plugins/${settings['che.factory.default_editor']}/devfile.yaml`)(this.store.dispatch, this.store.getState, undefined);
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
    await requestRegistriesMetadata(settings.cheWorkspaceDevfileRegistryUrl || '')(this.store.dispatch, this.store.getState, undefined);
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
