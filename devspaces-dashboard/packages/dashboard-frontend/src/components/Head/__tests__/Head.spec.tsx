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

import React from 'react';
import { Provider } from 'react-redux';
import renderer from 'react-test-renderer';
import Head from '..';
import { BrandingData } from '../../../services/bootstrap/branding.constant';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';

jest.mock('react-helmet', () => {
  const Helmet = (props: { children: React.ReactElement[] }) => {
    return <React.Fragment>{props.children}</React.Fragment>;
  };
  Helmet.displayName = 'fake-react-helmet';
  return { Helmet };
});

describe('The head component for setting document title', () => {
  const store = new FakeStoreBuilder()
    .withBranding({ title: 'Dummy product title' } as BrandingData)
    .build();

  it('should render default title correctly', () => {
    const element = (
      <Provider store={store}>
        <Head />
      </Provider>
    );

    expect(renderer.create(element).toJSON()).toMatchSnapshot();
  });

  it('should render Quick Add page title correctly', () => {
    const element = (
      <Provider store={store}>
        <Head pageName="Quick Add" />
      </Provider>
    );

    expect(renderer.create(element).toJSON()).toMatchSnapshot();
  });
});
