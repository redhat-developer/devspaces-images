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

import * as BannerAlertStore from '@/store/BannerAlert';
import * as BrandingStore from '@/store/Branding';
import * as ClusterConfig from '@/store/ClusterConfig';
import * as ClusterInfo from '@/store/ClusterInfo';
import * as DevfileRegistriesStore from '@/store/DevfileRegistries';
import * as DockerConfigStore from '@/store/DockerConfig';
import * as EventsStore from '@/store/Events';
import * as FactoryResolverStore from '@/store/FactoryResolver';
import * as GitConfigStore from '@/store/GitConfig';
import * as GitOauthConfigStore from '@/store/GitOauthConfig';
import * as InfrastructureNamespacesStore from '@/store/InfrastructureNamespaces';
import * as PersonalAccessToken from '@/store/PersonalAccessToken';
import * as PluginsStore from '@/store/Plugins/chePlugins';
import * as DwPluginsStore from '@/store/Plugins/devWorkspacePlugins';
import * as PodsStore from '@/store/Pods';
import * as LogsStore from '@/store/Pods/Logs';
import * as SanityCheckStore from '@/store/SanityCheck';
import * as DwServerConfigStore from '@/store/ServerConfig';
import * as SshKeysStore from '@/store/SshKeys';
import * as UserIdStore from '@/store/User/Id';
import * as UserProfileStore from '@/store/User/Profile';
import * as WorkspacesStore from '@/store/Workspaces';
import * as DevWorkspacesStore from '@/store/Workspaces/devWorkspaces';

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
  gitConfig: GitConfigStore.State;
  gitOauthConfig: GitOauthConfigStore.State;
  infrastructureNamespaces: InfrastructureNamespacesStore.State;
  logs: LogsStore.State;
  personalAccessToken: PersonalAccessToken.State;
  plugins: PluginsStore.State;
  pods: PodsStore.State;
  sanityCheck: SanityCheckStore.State;
  sshKeys: SshKeysStore.State;
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
  gitConfig: GitConfigStore.reducer,
  gitOauthConfig: GitOauthConfigStore.reducer,
  infrastructureNamespaces: InfrastructureNamespacesStore.reducer,
  logs: LogsStore.reducer,
  personalAccessToken: PersonalAccessToken.reducer,
  plugins: PluginsStore.reducer,
  pods: PodsStore.reducer,
  sanityCheck: SanityCheckStore.reducer,
  sshKeys: SshKeysStore.reducer,
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
