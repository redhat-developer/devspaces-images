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
import { selectDevworkspacesEnabled } from '../Workspaces/Settings/selectors';
import  { State } from  './dockerConfigState';

const selectCheDockerConfigState = (state: AppState) => state.cheDockerConfig;
const selectDwDockerConfigState = (state: AppState) => state.dwDockerConfig;

const selectState = createSelector(
  selectDevworkspacesEnabled,
  selectCheDockerConfigState,
  selectDwDockerConfigState,
  (devworkspaceEnabled, cheDockerConfigState, dwDockerConfigState) => {
    if (devworkspaceEnabled) {
      return dwDockerConfigState;
    } else {
      return cheDockerConfigState;
    }
  },
);

export const selectIsLoading = createSelector(
  selectState,
  (state) => {
    return state.isLoading;
  },
);

export const selectRegistries = createSelector(
  selectState,
  (state: State) => {
    return state.registries;
  },
);

export const selectError = createSelector(
  selectState,
  (state) => {
    return state.error;
  },
);
