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

import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';
import * as BannerAlertStore from './BannerAlert';
import * as BrandingStore from './Branding';
import * as ClusterConfig from './ClusterConfig';
import * as ClusterInfo from './ClusterInfo';
import * as DevfileRegistriesStore from './DevfileRegistries';
import * as DockerConfigStore from './DockerConfig';
import * as FactoryResolverStore from './FactoryResolver';
import * as InfrastructureNamespacesStore from './InfrastructureNamespaces';
import * as PluginsStore from './Plugins/chePlugins';
import * as SanityCheckStore from './SanityCheck';
import * as DwPluginsStore from './Plugins/devWorkspacePlugins';
import * as DwServerConfigStore from './ServerConfig';
import * as UserProfileStore from './UserProfile';
import * as WorkspacesStore from './Workspaces';
import * as DevWorkspacesStore from './Workspaces/devWorkspaces';
import * as WorkspacesSettingsStore from './Workspaces/Settings';
import * as GitOauthConfigStore from './GitOauthConfig';
import * as EventsStore from './Events';
import * as PodsStore from './Pods';

// the top-level state object
export interface AppState {
  bannerAlert: BannerAlertStore.State;
  branding: BrandingStore.State;
  clusterConfig: ClusterConfig.State;
  clusterInfo: ClusterInfo.State;
  devWorkspaces: DevWorkspacesStore.State;
  devfileRegistries: DevfileRegistriesStore.State;
  gitOauthConfig: GitOauthConfigStore.State;
  dockerConfig: DockerConfigStore.State;
  dwPlugins: DwPluginsStore.State;
  dwServerConfig: DwServerConfigStore.State;
  factoryResolver: FactoryResolverStore.State;
  infrastructureNamespaces: InfrastructureNamespacesStore.State;
  plugins: PluginsStore.State;
  sanityCheck: SanityCheckStore.State;
  userProfile: UserProfileStore.State;
  workspaces: WorkspacesStore.State;
  workspacesSettings: WorkspacesSettingsStore.State;
  events: EventsStore.State;
  pods: PodsStore.State;
}

export const reducers = {
  bannerAlert: BannerAlertStore.reducer,
  branding: BrandingStore.reducer,
  clusterConfig: ClusterConfig.reducer,
  clusterInfo: ClusterInfo.reducer,
  devWorkspaces: DevWorkspacesStore.reducer,
  devfileRegistries: DevfileRegistriesStore.reducer,
  gitOauthConfig: GitOauthConfigStore.reducer,
  dockerConfig: DockerConfigStore.reducer,
  dwPlugins: DwPluginsStore.reducer,
  dwServerConfig: DwServerConfigStore.reducer,
  factoryResolver: FactoryResolverStore.reducer,
  infrastructureNamespaces: InfrastructureNamespacesStore.reducer,
  plugins: PluginsStore.reducer,
  sanityCheck: SanityCheckStore.reducer,
  userProfile: UserProfileStore.reducer,
  workspaces: WorkspacesStore.reducer,
  workspacesSettings: WorkspacesSettingsStore.reducer,
  events: EventsStore.reducer,
  pods: PodsStore.reducer,
};

export type AppThunk<ActionType extends Action, ReturnType = void> = ThunkAction<
  ReturnType,
  AppState,
  unknown,
  ActionType
>;
