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

const selectState = (state: AppState) => state.pods;

export const selectAllPods = createSelector(selectState, state => state.pods);

export const selectPodsError = createSelector(selectState, state => state.error);

export const selectPodsIsLoading = createSelector(selectState, state => state.isLoading);

export const selectPodsResourceVersion = createSelector(
  selectState,
  state => state.resourceVersion,
);
