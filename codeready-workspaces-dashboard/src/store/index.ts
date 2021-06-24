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
import * as BrandingStore from './Branding';
import * as DevfileRegistriesStore from './DevfileRegistries';
import * as FactoryResolver from './FactoryResolver';
import * as InfrastructureNamespacesStore from './InfrastructureNamespaces';
import * as Plugins from './Plugins/chePlugins';
import * as UserPreferences from './UserPreferences';
import * as WorkspacesStore from './Workspaces';
import * as CheWorkspacesStore from './Workspaces/cheWorkspaces';
import * as DevWorkspacesStore from './Workspaces/devWorkspaces';
import * as UserStore from './User';
import * as UserProfileStore from './UserProfile';
import * as DwPluginsStore from './Plugins/devWorkspacePlugins';
import * as WorkspacesSettingsStore from './Workspaces/Settings';

// the top-level state object
export interface AppState {
  branding: BrandingStore.State;
  devfileRegistries: DevfileRegistriesStore.State;
  infrastructureNamespaces: InfrastructureNamespacesStore.State;
  user: UserStore.State;
  userProfile: UserProfileStore.State;
  workspaces: WorkspacesStore.State;
  cheWorkspaces: CheWorkspacesStore.State;
  devWorkspaces: DevWorkspacesStore.State;
  plugins: Plugins.State;
  factoryResolver: FactoryResolver.State;
  userPreferences: UserPreferences.State;
  dwPlugins: DwPluginsStore.State;
  workspacesSettings: WorkspacesSettingsStore.State,
}

export const reducers = {
  workspaces: WorkspacesStore.reducer,
  cheWorkspaces: CheWorkspacesStore.reducer,
  devWorkspaces: DevWorkspacesStore.reducer,
  devfileRegistries: DevfileRegistriesStore.reducer,
  branding: BrandingStore.reducer,
  user: UserStore.reducer,
  userProfile: UserProfileStore.reducer,
  infrastructureNamespaces: InfrastructureNamespacesStore.reducer,
  plugins: Plugins.reducer,
  factoryResolver: FactoryResolver.reducer,
  userPreferences: UserPreferences.reducer,
  dwPlugins: DwPluginsStore.reducer,
  workspacesSettings: WorkspacesSettingsStore.reducer,
};

// this type can be used as a hint on action creators so that its 'dispatch' and 'getState' params are
// correctly typed to match your store.
/**
 * @deprecated
 */
export interface AppThunkAction<TAction> {
  (dispatch: (action: TAction) => void, getState: () => AppState): void;
}
export type AppThunk<ActionType extends Action, ReturnType = void> = ThunkAction<
  ReturnType,
  AppState,
  unknown,
  ActionType
>;
