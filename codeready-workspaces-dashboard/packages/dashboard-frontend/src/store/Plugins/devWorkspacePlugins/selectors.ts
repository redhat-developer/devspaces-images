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
import { IDevWorkspaceDevfile } from '@eclipse-che/devworkspace-client';

const selectState = (state: AppState) => state.dwPlugins;
export const selectPluginsState = selectState;

export const selectDwPlugins = createSelector(
  selectState,
  state => state.plugins,
);

export const selectDwPluginsList = createSelector(
  selectState,
  state => Object.values(state.plugins)
    .map(entry => entry.plugin)
    .filter(plugin => plugin) as IDevWorkspaceDevfile[],
);

export const selectDwDefaultEditorError = createSelector(
  selectState,
  state => state.defaultEditorError,
);
