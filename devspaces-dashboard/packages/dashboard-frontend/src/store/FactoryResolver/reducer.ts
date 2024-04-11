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

import { Action, Reducer } from 'redux';

import { KnownAction, State } from '@/store/FactoryResolver/types';
import { createObject } from '@/store/helpers';

const unloadedState: State = {
  isLoading: false,
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
    case 'REQUEST_FACTORY_RESOLVER':
      return createObject<State>(state, {
        isLoading: true,
        error: undefined,
      });
    case 'RECEIVE_FACTORY_RESOLVER':
      return createObject<State>(state, {
        isLoading: false,
        resolver: action.resolver,
      });
    case 'RECEIVE_FACTORY_RESOLVER_ERROR':
      return createObject<State>(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
};
