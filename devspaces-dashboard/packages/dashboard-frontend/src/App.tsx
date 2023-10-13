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

import '@/app.css';

import { ConnectedRouter } from 'connected-react-router';
import { History } from 'history';
import React, { Suspense } from 'react';

import AppAlertGroup from '@/components/AppAlertGroup';
import Fallback from '@/components/Fallback';
import Head from '@/components/Head';
import Layout from '@/Layout';
import Routes from '@/Routes';

function AppComponent(props: { history: History }): React.ReactElement {
  return (
    <ConnectedRouter history={props.history}>
      <Head />
      <AppAlertGroup />
      <Layout history={props.history}>
        <Suspense fallback={Fallback}>
          <Routes />
        </Suspense>
      </Layout>
    </ConnectedRouter>
  );
}
AppComponent.displayName = 'AppComponent';
export default AppComponent;
