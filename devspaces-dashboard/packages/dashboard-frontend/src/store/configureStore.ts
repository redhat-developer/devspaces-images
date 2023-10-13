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

import { connectRouter, routerMiddleware } from 'connected-react-router';
import { History } from 'history';
import { applyMiddleware, combineReducers, compose, createStore, Store } from 'redux';
import thunk from 'redux-thunk';

import { sanityCheckMiddleware } from '@/store/sanityCheckMiddleware';

import { AppState, reducers } from '.';

export default function configureStore(history: History, initialState?: AppState): Store<AppState> {
  const rootReducer = combineReducers({
    ...reducers,
    router: connectRouter(history),
  });

  const middleware = [thunk, routerMiddleware(history), sanityCheckMiddleware];

  const enhancers: Array<() => void> = [];
  const windowIfDefined = typeof window === 'undefined' ? null : (window as Window);
  if (windowIfDefined && windowIfDefined['__REDUX_DEVTOOLS_EXTENSION__']) {
    enhancers.push(windowIfDefined['__REDUX_DEVTOOLS_EXTENSION__']());
  }

  return createStore(
    rootReducer,
    initialState,
    compose(applyMiddleware(...middleware), ...enhancers),
  );
}
