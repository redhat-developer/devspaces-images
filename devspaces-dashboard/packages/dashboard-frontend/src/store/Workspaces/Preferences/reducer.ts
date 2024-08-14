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
import { Action, Reducer } from 'redux';

import { KnownAction } from '@/store/Workspaces/Preferences/types';
import { Type } from '@/store/Workspaces/Preferences/types';
import { State } from '@/store/Workspaces/Preferences/types';

export const unloadedState: State = {
  isLoading: false,
  preferences: {
    'skip-authorisation': [],
  } as api.IWorkspacePreferences,
};

export const reducer: Reducer<State> = (
  state: State | undefined,
  incomingAction: Action,
): State => {
  if (state === undefined) {
    return unloadedState;
  }

  const action = incomingAction as KnownAction;
  switch (action.type) {
    case Type.REQUEST_PREFERENCES:
      return {
        ...state,
        isLoading: true,
      };
    case Type.RECEIVE_PREFERENCES:
      return {
        ...state,
        isLoading: false,
        preferences: action.preferences,
      };
    case Type.ERROR_PREFERENCES:
      return {
        ...state,
        isLoading: false,
        error: action.error,
      };
    default:
      return state;
  }
};
