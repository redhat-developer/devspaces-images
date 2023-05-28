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
import * as DevWorkspacesStore from './Workspaces/devWorkspaces';
import * as DevfileRegistriesStore from './DevfileRegistries';
import * as DockerConfigStore from './DockerConfig';
import * as DwPluginsStore from './Plugins/devWorkspacePlugins';
import * as DwServerConfigStore from './ServerConfig';
import * as EventsStore from './Events';
import * as FactoryResolverStore from './FactoryResolver';
import * as GitOauthConfigStore from './GitOauthConfig';
import * as InfrastructureNamespacesStore from './InfrastructureNamespaces';
import * as LogsStore from './Pods/Logs';
import * as PersonalAccessToken from './PersonalAccessToken';
import * as PluginsStore from './Plugins/chePlugins';
import * as PodsStore from './Pods';
import * as SanityCheckStore from './SanityCheck';
import * as UserIdStore from './User/Id';
import * as UserProfileStore from './User/Profile';
import * as WorkspacesStore from './Workspaces';

// the top-level state object
export interface AppState {
  bannerAlert: BannerAlertStore.State;
  branding: BrandingStore.State;
  clusterConfig: ClusterConfig.State;
  clusterInfo: ClusterInfo.State;
  devWorkspaces: DevWorkspacesStore.State;
  devfileRegistries: DevfileRegistriesStore.State;
  dockerConfig: DockerConfigStore.State;
  dwPlugins: DwPluginsStore.State;
  dwServerConfig: DwServerConfigStore.State;
  events: EventsStore.State;
  factoryResolver: FactoryResolverStore.State;
  gitOauthConfig: GitOauthConfigStore.State;
  infrastructureNamespaces: InfrastructureNamespacesStore.State;
  logs: LogsStore.State;
  personalAccessToken: PersonalAccessToken.State;
  plugins: PluginsStore.State;
  pods: PodsStore.State;
  sanityCheck: SanityCheckStore.State;
  userId: UserIdStore.State;
  userProfile: UserProfileStore.State;
  workspaces: WorkspacesStore.State;
}

export const reducers = {
  bannerAlert: BannerAlertStore.reducer,
  branding: BrandingStore.reducer,
  clusterConfig: ClusterConfig.reducer,
  clusterInfo: ClusterInfo.reducer,
  devWorkspaces: DevWorkspacesStore.reducer,
  devfileRegistries: DevfileRegistriesStore.reducer,
  dockerConfig: DockerConfigStore.reducer,
  dwPlugins: DwPluginsStore.reducer,
  dwServerConfig: DwServerConfigStore.reducer,
  events: EventsStore.reducer,
  factoryResolver: FactoryResolverStore.reducer,
  gitOauthConfig: GitOauthConfigStore.reducer,
  infrastructureNamespaces: InfrastructureNamespacesStore.reducer,
  logs: LogsStore.reducer,
  personalAccessToken: PersonalAccessToken.reducer,
  plugins: PluginsStore.reducer,
  pods: PodsStore.reducer,
  sanityCheck: SanityCheckStore.reducer,
  userId: UserIdStore.reducer,
  userProfile: UserProfileStore.reducer,
  workspaces: WorkspacesStore.reducer,
};

export type AppThunk<ActionType extends Action, ReturnType = void> = ThunkAction<
  ReturnType,
  AppState,
  unknown,
  ActionType
>;
