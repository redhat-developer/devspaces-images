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
import devfileApi from '../../../services/devfileApi';
import { cloneDeep } from 'lodash';

const selectState = (state: AppState) => state.dwPlugins;
export const selectPluginsState = selectState;

export const selectDwPlugins = createSelector(selectState, state => state.plugins);

export const selectDwPluginsList = createSelector(
  selectState,
  state =>
    Object.values(state.plugins)
      .map(entry => entry.plugin)
      .filter(plugin => plugin) as devfileApi.Devfile[],
);

export const selectDwEditorsPluginsList = (EDITOR_NAME?: string) =>
  createSelector(
    selectState,
    state =>
      cloneDeep(
        Object.keys(state.editors)
          .filter(key => key === EDITOR_NAME)
          .map(key => state.editors[key])
          .filter(entry => entry.plugin)
          .map(entry => ({ devfile: entry.plugin, url: entry.url })),
      ) as {
        devfile: devfileApi.Devfile;
        url: string;
      }[],
  );

export const selectDefaultEditor = createSelector(selectState, state => state.defaultEditorName);

export const selectDwDefaultEditorError = createSelector(
  selectState,
  state => state.defaultEditorError,
);
