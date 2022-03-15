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
import * as ClusterInfo from './ClusterInfo';
import * as ClusterConfig from './ClusterConfig';
import * as DevfileRegistriesStore from './DevfileRegistries';
import * as FactoryResolverStore from './FactoryResolver';
import * as InfrastructureNamespacesStore from './InfrastructureNamespaces';
import * as PluginsStore from './Plugins/chePlugins';
import * as UserPreferences from './UserPreferences';
import * as WorkspacesStore from './Workspaces';
import * as CheWorkspacesStore from './Workspaces/cheWorkspaces';
import * as DevWorkspacesStore from './Workspaces/devWorkspaces';
import * as UserStore from './User';
import * as UserProfileStore from './UserProfile';
import * as DwPluginsStore from './Plugins/devWorkspacePlugins';
import * as WorkspacesSettingsStore from './Workspaces/Settings';
import * as CheDockerConfigStore from './DockerConfig/che';
import * as DwDockerConfigStore from './DockerConfig/dw';

// the top-level state object
export interface AppState {
  bannerAlert: BannerAlertStore.State;
  branding: BrandingStore.State;
  clusterInfo: ClusterInfo.State;
  clusterConfig: ClusterConfig.State;
  devfileRegistries: DevfileRegistriesStore.State;
  infrastructureNamespaces: InfrastructureNamespacesStore.State;
  user: UserStore.State;
  userProfile: UserProfileStore.State;
  workspaces: WorkspacesStore.State;
  cheWorkspaces: CheWorkspacesStore.State;
  devWorkspaces: DevWorkspacesStore.State;
  plugins: PluginsStore.State;
  factoryResolver: FactoryResolverStore.State;
  userPreferences: UserPreferences.State;
  dwPlugins: DwPluginsStore.State;
  workspacesSettings: WorkspacesSettingsStore.State;
  cheDockerConfig: CheDockerConfigStore.State;
  dwDockerConfig: DwDockerConfigStore.State;
}

export const reducers = {
  bannerAlert: BannerAlertStore.reducer,
  workspaces: WorkspacesStore.reducer,
  cheWorkspaces: CheWorkspacesStore.reducer,
  devWorkspaces: DevWorkspacesStore.reducer,
  devfileRegistries: DevfileRegistriesStore.reducer,
  branding: BrandingStore.reducer,
  clusterInfo: ClusterInfo.reducer,
  clusterConfig: ClusterConfig.reducer,
  user: UserStore.reducer,
  userProfile: UserProfileStore.reducer,
  infrastructureNamespaces: InfrastructureNamespacesStore.reducer,
  plugins: PluginsStore.reducer,
  factoryResolver: FactoryResolverStore.reducer,
  userPreferences: UserPreferences.reducer,
  dwPlugins: DwPluginsStore.reducer,
  workspacesSettings: WorkspacesSettingsStore.reducer,
  cheDockerConfig: CheDockerConfigStore.reducer,
  dwDockerConfig: DwDockerConfigStore.reducer,
};

export type AppThunk<ActionType extends Action, ReturnType = void> = ThunkAction<
  ReturnType,
  AppState,
  unknown,
  ActionType
>;
