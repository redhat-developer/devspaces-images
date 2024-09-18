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

import { createSelector } from 'reselect';

import { che } from '@/services/models';

import { AppState } from '..';

const selectState = (state: AppState) => state.dwServerConfig;
export const selectServerConfigState = selectState;

export const selectDefaultComponents = createSelector(
  selectState,
  state => state.config.defaults?.components || [],
);

export const selectDefaultEditor = createSelector(
  selectState,
  state => state.config.defaults?.editor || 'che-incubator/che-code/latest',
);

export const selectDefaultPlugins = createSelector(
  selectState,
  state => state.config.defaults?.plugins || [],
);

export const selectPluginRegistryUrl = createSelector(selectState, state => {
  const pluginRegistryUrl = !state.config.pluginRegistry.disableInternalRegistry
    ? state.config.pluginRegistryURL
    : state.config.pluginRegistry.externalPluginRegistries?.[0]?.url;
  return pluginRegistryUrl || '';
});

export const selectPluginRegistryInternalUrl = createSelector(
  selectState,
  state => state.config.pluginRegistryInternalURL,
);

export const selectOpenVSXUrl = createSelector(
  selectState,
  state => state.config.pluginRegistry?.openVSXURL,
);

export const selectPvcStrategy = createSelector(
  selectState,
  state => (state.config.defaults.pvcStrategy || '') as che.WorkspaceStorageType,
);

export const selectStartTimeout = createSelector(
  selectState,
  state => (state.config.timeouts as any)?.startTimeout,
);

export const selectDashboardLogo = createSelector(selectState, state => state.config.dashboardLogo);

export const selectAdvancedAuthorization = createSelector(
  selectState,
  state => state.config.networking?.auth?.advancedAuthorization,
);

export const selectAutoProvision = createSelector(
  selectState,
  state => state.config.defaultNamespace.autoProvision,
);

export const selectAllowedSources = createSelector(
  selectState,
  state => state.config.allowedSourceUrls || [],
);

export const selectIsAllowedSourcesConfigured = createSelector(
  selectAllowedSources,
  allowedSources => {
    return allowedSources.length > 0;
  },
);

export const selectServerConfigError = createSelector(selectState, state => state.error);
