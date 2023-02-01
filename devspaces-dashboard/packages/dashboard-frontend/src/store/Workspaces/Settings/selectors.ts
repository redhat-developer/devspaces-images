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
import { AppState } from '../..';

const selectState = (state: AppState) => state.workspacesSettings;
export const selectWorkspacesSettingsState = selectState;

export const selectWorkspacesSettings = createSelector(selectState, state => state.settings);

export const selectWorkspacesSettingsError = createSelector(selectState, state => state.error);
