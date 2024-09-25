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

import '@/app.css';

import { History } from 'history';
import React, { Suspense } from 'react';
import { HashRouter } from 'react-router-dom';

import AppAlertGroup from '@/components/AppAlertGroup';
import Fallback from '@/components/Fallback';
import Head from '@/components/Head';
import Layout from '@/Layout';
import { AppRoutes } from '@/Routes';

function AppComponent(props: { history: History }): React.ReactElement {
  return (
    <HashRouter>
      <Head />
      <AppAlertGroup />
      <Layout history={props.history}>
        <Suspense fallback={Fallback}>
          <AppRoutes />
        </Suspense>
      </Layout>
    </HashRouter>
  );
}
AppComponent.displayName = 'AppComponent';
export default AppComponent;
