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
import * as storageTypesService from '../../../services/storageTypes';
import { isDevworkspacesEnabled } from '../../../services/helpers/devworkspace';

const selectState = (state: AppState) => state.workspacesSettings;
export const selectWorkspacesSettingsState = selectState;

export const selectWorkspacesSettings = createSelector(selectState, state => state.settings);

export const selectAvailableStorageTypes = createSelector(selectWorkspacesSettings, settings =>
  storageTypesService.getAvailable(settings),
);

export const selectWorkspacesSettingsError = createSelector(selectState, state => state.error);

export const selectDevworkspacesEnabled = createSelector(selectState, state =>
  isDevworkspacesEnabled(state?.settings || {}),
);
