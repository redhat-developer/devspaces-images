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

import { Action, Reducer } from 'redux';

import { KnownAction, State, Type } from '@/store/GitConfig/types';
import { createObject } from '@/store/helpers';

const unloadedState: State = {
  isLoading: false,
  config: undefined,
  error: undefined,
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
    case Type.REQUEST_GITCONFIG:
      return createObject(state, {
        isLoading: true,
        error: undefined,
      });
    case Type.RECEIVE_GITCONFIG:
      return createObject(state, {
        isLoading: false,
        error: undefined,
        config: action.config,
      });
    case Type.RECEIVE_GITCONFIG_ERROR:
      return createObject(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};
