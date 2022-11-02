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

import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';
import * as BannerAlertStore from './BannerAlert';
import * as BrandingStore from './Branding';
import * as ClusterConfig from './ClusterConfig';
import * as ClusterInfo from './ClusterInfo';
import * as DevfileRegistriesStore from './DevfileRegistries';
import * as CheDockerConfigStore from './DockerConfig/che';
import * as DwDockerConfigStore from './DockerConfig/dw';
import * as FactoryResolverStore from './FactoryResolver';
import * as InfrastructureNamespacesStore from './InfrastructureNamespaces';
import * as PluginsStore from './Plugins/chePlugins';
import * as DwPluginsStore from './Plugins/devWorkspacePlugins';
import * as DwServerConfigStore from './ServerConfig';
import * as UserPreferences from './UserPreferences';
import * as UserProfileStore from './UserProfile';
import * as WorkspacesStore from './Workspaces';
import * as CheWorkspacesStore from './Workspaces/cheWorkspaces';
import * as DevWorkspacesStore from './Workspaces/devWorkspaces';
import * as WorkspacesSettingsStore from './Workspaces/Settings';

// the top-level state object
export interface AppState {
  bannerAlert: BannerAlertStore.State;
  branding: BrandingStore.State;
  cheDockerConfig: CheDockerConfigStore.State;
  cheWorkspaces: CheWorkspacesStore.State;
  clusterConfig: ClusterConfig.State;
  clusterInfo: ClusterInfo.State;
  devWorkspaces: DevWorkspacesStore.State;
  devfileRegistries: DevfileRegistriesStore.State;
  dwDockerConfig: DwDockerConfigStore.State;
  dwPlugins: DwPluginsStore.State;
  dwServerConfig: DwServerConfigStore.State;
  factoryResolver: FactoryResolverStore.State;
  infrastructureNamespaces: InfrastructureNamespacesStore.State;
  plugins: PluginsStore.State;
  userPreferences: UserPreferences.State;
  userProfile: UserProfileStore.State;
  workspaces: WorkspacesStore.State;
  workspacesSettings: WorkspacesSettingsStore.State;
}

export const reducers = {
  bannerAlert: BannerAlertStore.reducer,
  branding: BrandingStore.reducer,
  cheDockerConfig: CheDockerConfigStore.reducer,
  cheWorkspaces: CheWorkspacesStore.reducer,
  clusterConfig: ClusterConfig.reducer,
  clusterInfo: ClusterInfo.reducer,
  devWorkspaces: DevWorkspacesStore.reducer,
  devfileRegistries: DevfileRegistriesStore.reducer,
  dwDockerConfig: DwDockerConfigStore.reducer,
  dwPlugins: DwPluginsStore.reducer,
  dwServerConfig: DwServerConfigStore.reducer,
  factoryResolver: FactoryResolverStore.reducer,
  infrastructureNamespaces: InfrastructureNamespacesStore.reducer,
  plugins: PluginsStore.reducer,
  userPreferences: UserPreferences.reducer,
  userProfile: UserProfileStore.reducer,
  workspaces: WorkspacesStore.reducer,
  workspacesSettings: WorkspacesSettingsStore.reducer,
};

export type AppThunk<ActionType extends Action, ReturnType = void> = ThunkAction<
  ReturnType,
  AppState,
  unknown,
  ActionType
>;
