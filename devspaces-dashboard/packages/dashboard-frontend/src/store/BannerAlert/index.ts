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
import { AppThunk } from '..';
import { createObject } from '../helpers';

export interface State {
  messages: string[];
}

export interface AddBannerAction {
  type: 'ADD_BANNER';
  message: string;
}

export interface RemoveBannerAction {
  type: 'REMOVE_BANNER';
  message: string;
}

type KnownAction = AddBannerAction | RemoveBannerAction;

export type ActionCreators = {
  addBanner: (message: string) => AppThunk<AddBannerAction>;
  removeBanner: (message: string) => AppThunk<RemoveBannerAction>;
};

export const actionCreators: ActionCreators = {
  addBanner:
    (message: string): AppThunk<AddBannerAction> =>
    dispatch => {
      dispatch({
        type: 'ADD_BANNER',
        message,
      });
    },

  removeBanner:
    (message: string): AppThunk<RemoveBannerAction> =>
    dispatch => {
      dispatch({
        type: 'REMOVE_BANNER',
        message,
      });
    },
};

const unloadedState: State = {
  messages: [],
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
    case 'ADD_BANNER':
      return createObject(state, {
        messages: state.messages.includes(action.message)
          ? state.messages
          : state.messages.concat([action.message]),
      });
    case 'REMOVE_BANNER':
      return createObject(state, {
        messages: state.messages.includes(action.message)
          ? state.messages.filter(message => message !== action.message)
          : state.messages,
      });
    default:
      return state;
  }
};
