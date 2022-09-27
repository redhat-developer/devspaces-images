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

const selectState = (state: AppState) => state.dwServerConfig;
export const selectServerConfigState = selectState;

export const selectDefaultComponents = createSelector(
  selectState,
  state => state.config.defaults?.components || [],
);

export const selectDefaultPlugins = createSelector(
  selectState,
  state => state.config.defaults?.plugins || [],
);

export const selectOpenVSXUrl = createSelector(
  selectState,
  state => state.config.pluginRegistry.openVSXURL,
);

export const selectPvcStrategy = createSelector(
  selectState,
  state => (state.config.defaults.pvcStrategy || 'per-workspace') as che.WorkspaceStorageType,
);

export const selectServerConfigError = createSelector(selectState, state => state.error);
