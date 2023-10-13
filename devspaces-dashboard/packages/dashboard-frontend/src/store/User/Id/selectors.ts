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

const selectState = (state: AppState) => state.userId;

export const selectCheUserIsLoading = createSelector(selectState, state => state.isLoading);

export const selectCheUserId = createSelector(selectState, state => state.cheUserId);

export const selectCheUserIdError = createSelector(selectState, state => state.error);
