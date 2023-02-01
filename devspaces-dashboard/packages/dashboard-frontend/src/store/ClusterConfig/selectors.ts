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

import { createSelector } from 'reselect';
import { AppState } from '..';

const selectState = (state: AppState) => state.clusterConfig;

export const selectDashboardWarning = createSelector(
  selectState,
  state => state.clusterConfig.dashboardWarning || [],
);

export const selectRunningWorkspacesLimit = createSelector(
  selectState,
  state => state.clusterConfig.runningWorkspacesLimit,
);

export const selectAllWorkspacesLimit = createSelector(
  selectState,
  state => state.clusterConfig.allWorkspacesLimit,
);

export const selectClusterConfigError = createSelector(selectState, state => state.error);
