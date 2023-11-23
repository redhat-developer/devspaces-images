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

import { State } from '@/store/GitOauthConfig/index';

import { AppState } from '..';

const selectState = (state: AppState) => state.gitOauthConfig;

export const selectIsLoading = createSelector(selectState, state => {
  return state.isLoading;
});

export const selectGitOauth = createSelector(selectState, (state: State) => {
  return state.gitOauth;
});

export const selectProvidersWithToken = createSelector(selectState, (state: State) => {
  return state.providersWithToken;
});

export const selectSkipOauthProviders = createSelector(selectState, (state: State) => {
  return state.skipOauthProviders;
});

export const selectError = createSelector(selectState, state => {
  return state.error;
});
