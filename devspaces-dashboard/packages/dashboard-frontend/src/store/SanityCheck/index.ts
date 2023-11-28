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

import { helpers } from '@eclipse-che/common';
import { Action, Reducer } from 'redux';

import { provisionKubernetesNamespace } from '@/services/backend-client/kubernetesNamespaceApi';
import { getDefer } from '@/services/helpers/deferred';
import { delay } from '@/services/helpers/delay';
import { signIn } from '@/services/helpers/login';
import {
  getErrorMessage,
  hasLoginPage,
  isForbidden,
  isUnauthorized,
} from '@/services/workspace-client/helpers';
import { createObject } from '@/store/helpers';

import { AppThunk } from '..';

const secToStale = 15;
const timeToStale = secToStale * 1000;
const maxAttemptsNumber = 2;

export interface State {
  authorized: Promise<boolean>;
  lastFetched: number;
  error?: string;
}

export enum Type {
  REQUEST_BACKEND_CHECK = 'REQUEST_BACKEND_CHECK',
  ABORT_BACKEND_CHECK = 'ABORT_BACKEND_CHECK',
  RECEIVED_BACKEND_CHECK = 'RECEIVED_BACKEND_CHECK',
  RECEIVED_BACKEND_CHECK_ERROR = 'RECEIVED_BACKEND_CHECK_ERROR',
}

export interface RequestBackendCheckAction extends Action {
  type: Type.REQUEST_BACKEND_CHECK;
  authorized: Promise<boolean>;
  lastFetched: number;
}

export interface AbortBackendCheckAction extends Action {
  type: Type.ABORT_BACKEND_CHECK;
}

export interface ReceivedBackendCheckAction extends Action {
  type: Type.RECEIVED_BACKEND_CHECK;
}

export interface ReceivedBackendCheckErrorAction extends Action {
  type: Type.RECEIVED_BACKEND_CHECK_ERROR;
  error: string;
}

type KnownAction =
  | RequestBackendCheckAction
  | AbortBackendCheckAction
  | ReceivedBackendCheckAction
  | ReceivedBackendCheckErrorAction;

export type ActionCreators = {
  testBackends: () => AppThunk<KnownAction, Promise<void>>;
};

export const actionCreators: ActionCreators = {
  testBackends:
    (): AppThunk<KnownAction, Promise<void>> =>
    async (dispatch, getState): Promise<void> => {
      const { lastFetched } = getState().sanityCheck;
      const timeElapsed = Date.now() - lastFetched;

      if (timeElapsed < timeToStale) {
        dispatch({
          type: Type.ABORT_BACKEND_CHECK,
        });
        return;
      }

      // do not reject this promise because it causes Uncaught promise rejection error
      const deferred = getDefer<boolean>();
      try {
        dispatch({
          type: Type.REQUEST_BACKEND_CHECK,
          authorized: deferred.promise,
          lastFetched: Date.now(),
        });

        for (let attempt = 1; attempt <= maxAttemptsNumber; attempt++) {
          try {
            await provisionKubernetesNamespace();

            deferred.resolve(true);
            dispatch({
              type: Type.RECEIVED_BACKEND_CHECK,
            });

            break;
          } catch (e) {
            if (attempt === maxAttemptsNumber) {
              throw e;
            }
            await delay(1000);
          }
        }
      } catch (e) {
        if (isUnauthorized(e) || (isForbidden(e) && hasLoginPage(e))) {
          signIn();
        }
        const errorMessage = getErrorMessage(e);
        dispatch({
          type: Type.RECEIVED_BACKEND_CHECK_ERROR,
          error: errorMessage,
        });
        deferred.resolve(false);
        console.error(helpers.errors.getMessage(e));
        if (
          helpers.errors.includesAxiosResponse(e) &&
          e.response.data.trace &&
          Array.isArray(e.response.data.trace)
        ) {
          console.error(e.response.data.trace.join('\n'));
        }
        throw new Error(errorMessage);
      }
    },
};

const unloadedState: State = {
  authorized: Promise.resolve(true),
  lastFetched: 0,
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
    case Type.REQUEST_BACKEND_CHECK:
      return createObject<State>(state, {
        error: undefined,
        authorized: action.authorized,
        lastFetched: action.lastFetched,
      });
    case Type.RECEIVED_BACKEND_CHECK:
      return createObject<State>(state, {});
    case Type.RECEIVED_BACKEND_CHECK_ERROR:
      return createObject<State>(state, {
        authorized: state.authorized,
        lastFetched: state.lastFetched,
        error: action.error,
      });
    default:
      return state;
  }
};
