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

import { AppState } from '@/store';

const selectState = (state: AppState) => state.workspacePreferences;

export const selectPreferences = createSelector(selectState, state => state.preferences);

export const selectPreferencesError = createSelector(selectState, state => state.error);

export const selectPreferencesSkipAuthorization = createSelector(
  selectPreferences,
  state => state['skip-authorisation'],
);

export const selectPreferencesTrustedSources = createSelector(
  selectPreferences,
  state => state['trusted-sources'],
);
