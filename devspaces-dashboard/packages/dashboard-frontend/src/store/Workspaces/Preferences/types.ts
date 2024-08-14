/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { api } from '@eclipse-che/common';
import { Action } from 'redux';

import { AppThunk } from '@/store';
import { SanityCheckAction } from '@/store/sanityCheckMiddleware';

export interface State {
  isLoading: boolean;
  preferences: api.IWorkspacePreferences;
  error?: string;
}

export enum Type {
  REQUEST_PREFERENCES = 'REQUEST_PREFERENCES',
  RECEIVE_PREFERENCES = 'RECEIVE_PREFERENCES',
  ERROR_PREFERENCES = 'ERROR_PREFERENCES',
  UPDATE_PREFERENCES = 'UPDATE_PREFERENCES',
}
export interface RequestPreferencesAction extends Action, SanityCheckAction {
  type: Type.REQUEST_PREFERENCES;
}

export interface ReceivePreferencesAction extends Action {
  type: Type.RECEIVE_PREFERENCES;
  preferences: api.IWorkspacePreferences;
}

export interface ErrorPreferencesAction extends Action {
  type: Type.ERROR_PREFERENCES;
  error: string;
}

export interface UpdatePreferencesAction extends Action {
  type: Type.UPDATE_PREFERENCES;
}
export type KnownAction =
  | RequestPreferencesAction
  | ReceivePreferencesAction
  | UpdatePreferencesAction
  | ErrorPreferencesAction;

export type ActionCreators = {
  requestPreferences: () => AppThunk<KnownAction, Promise<void>>;
  addTrustedSource: (
    trustedSource: api.TrustedSourceAll | api.TrustedSourceUrl,
  ) => AppThunk<KnownAction, Promise<void>>;
};
