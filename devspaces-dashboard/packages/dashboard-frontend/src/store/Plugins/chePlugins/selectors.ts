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

import { AppState } from '@/store';

const CHE_EDITOR = 'Che Editor';

const selectState = (state: AppState) => state.plugins;
export const selectPluginsState = selectState;

export const selectPlugins = createSelector(selectState, state =>
  state.plugins.filter(item => item.type !== CHE_EDITOR),
);

export const selectEditors = createSelector(selectState, state =>
  state.plugins.filter(item => item.type === CHE_EDITOR),
);

export const selectPluginsError = createSelector(selectState, state => state.error);
