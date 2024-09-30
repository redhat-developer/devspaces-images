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

import '@patternfly/react-core/dist/styles/base.css';
import 'reflect-metadata';
import '@/overrides.css';

import { createHashHistory } from 'history';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import App from '@/App';
import WorkspaceActionsProvider from '@/contexts/WorkspaceActions/Provider';
import PreloadData from '@/services/bootstrap';
import configureStore from '@/store/configureStore';

startApp();

async function startApp(): Promise<void> {
  const history = createHashHistory();
  const store = configureStore(history);

  const root = ReactDOM.createRoot(document.querySelector('.ui-container'));
  try {
    // preload app data
    await new PreloadData(store).init();
    console.log('UD: preload data complete successfully.');
  } catch (error) {
    console.error('UD: preload data failed.', error);
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js');
  }

  root.render(
    <Provider store={store}>
      <WorkspaceActionsProvider history={history}>
        <App history={history} />
      </WorkspaceActionsProvider>
    </Provider>,
  );
}
