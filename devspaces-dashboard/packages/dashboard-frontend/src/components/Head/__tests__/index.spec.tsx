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

import React from 'react';
import { Provider } from 'react-redux';

import Head from '@/components/Head';
import getComponentRenderer from '@/services/__mocks__/getComponentRenderer';
import { BrandingData } from '@/services/bootstrap/branding.constant';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

const { createSnapshot } = getComponentRenderer(getComponent);

jest.mock('react-helmet', () => {
  const Helmet = (props: { children: React.ReactElement[] }) => {
    return <React.Fragment>{props.children}</React.Fragment>;
  };
  Helmet.displayName = 'fake-react-helmet';
  return { Helmet };
});

describe('The head component for setting document title', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render default title correctly', () => {
    const snapshot = createSnapshot();
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  it('should render Quick Add page title correctly', () => {
    const snapshot = createSnapshot('Quick Add');
    expect(snapshot.toJSON()).toMatchSnapshot();
  });
});

function getComponent(pageName?: string): React.ReactElement {
  const store = new FakeStoreBuilder()
    .withBranding({ title: 'Dummy product title' } as BrandingData)
    .build();

  return (
    <Provider store={store}>
      <Head pageName={pageName} />
    </Provider>
  );
}
