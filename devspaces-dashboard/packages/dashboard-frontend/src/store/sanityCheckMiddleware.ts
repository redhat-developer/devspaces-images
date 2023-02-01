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

import { AnyAction } from 'redux';
import { ThunkMiddleware } from 'redux-thunk';
import { AppState } from '.';
import * as AuthorizationStore from './SanityCheck';

export const AUTHORIZED = Symbol('Authorized resource');

export interface SanityCheckAction extends AnyAction {
  check: typeof AUTHORIZED;
}

function isSanityCheck(action: AnyAction): action is SanityCheckAction {
  return action.check === AUTHORIZED;
}

export const sanityCheckMiddleware: ThunkMiddleware<AppState, AnyAction> =
  storeApi => next => async action => {
    if (isSanityCheck(action)) {
      try {
        await AuthorizationStore.actionCreators.testBackends()(
          storeApi.dispatch,
          storeApi.getState,
          undefined,
        );
      } catch (e) {
        // noop
      }
    }
    return next(action);
  };
