/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import 'reflect-metadata';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createHashHistory } from 'history';
import '@patternfly/react-core/dist/styles/base.css';
import 'monaco-editor-core/esm/vs/base/browser/ui/codiconLabel/codicon/codicon.css';
import configureStore from './store/configureStore';
import App from './App';
import PreloadData from './services/bootstrap';
import { container } from './inversify.config';
import { KeycloakSetupService } from './services/keycloak/setup';

import './overrides.styl';

startApp();

async function startApp(): Promise<void> {
  const keycloakSetupService = container.get(KeycloakSetupService);
  try {
    await keycloakSetupService.start();
  } catch (error) {
    console.error('Keycloak initialization failed. ', error);
  }

  const history = createHashHistory();
  const store = configureStore(history);

  const ROOT = document.querySelector('.ui-container');
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

  ReactDOM.render(
    <Provider store={store}>
      <App history={history} />
    </Provider>,
    ROOT,
  );
}
