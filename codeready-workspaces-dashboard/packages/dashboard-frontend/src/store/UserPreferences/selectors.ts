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

import { createSelector } from 'reselect';
import { AppState } from '..';
import { RegistryRow, ContainerCredentials } from './types';

const selectState = (state: AppState) => state.userPreferences;

export const selectIsLoading = createSelector(
  selectState,
  state => state.isLoading,
);

export const selectPreferences = createSelector(
  selectState,
  state => state.preferences
);

export const selectRegistries = createSelector(
  selectState,
  state => getRegistries(state.preferences)
);

function getRegistries(preferences: che.UserPreferences): RegistryRow[] {
  const registries: RegistryRow[] = [];
  if (preferences.dockerCredentials) {
    const containerCredentials: ContainerCredentials = JSON.parse(atob(preferences.dockerCredentials));
    for (const [url, value] of Object.entries(containerCredentials)) {
      const { username, password } = value || {};
      registries.push({ url, username, password });
    }
  }
  return registries;
}
