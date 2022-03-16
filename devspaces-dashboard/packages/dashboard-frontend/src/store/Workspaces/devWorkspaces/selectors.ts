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
import { AppState } from '../..';

const selectState = (state: AppState) => state.devWorkspaces;
export const selectDevWorkspacesState = selectState;

export const selectDevWorkspacesResourceVersion = createSelector(selectState, state => {
  return state.resourceVersion;
});

export const selectAllDevWorkspaces = createSelector(selectState, state => {
  return state.workspaces;
});

export const selectDevWorkspacesError = createSelector(selectState, state => state.error);
