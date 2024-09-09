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

import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import mockMetadata from '@/pages/GetStarted/__tests__/devfileMetadata.json';
import mockPlugins from '@/pages/GetStarted/__tests__/plugins.json';
import SamplesListGallery from '@/pages/GetStarted/SamplesList/Gallery';
import getComponentRenderer, { screen, within } from '@/services/__mocks__/getComponentRenderer';
import { BrandingData } from '@/services/bootstrap/branding.constant';
import { che } from '@/services/models';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { DevfileRegistryMetadata } from '@/store/DevfileRegistries/selectors';

jest.mock('@/pages/GetStarted/SamplesList/Gallery/Card');

const mockOnCardClick = jest.fn();

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const metadata = mockMetadata as DevfileRegistryMetadata[];
const plugins = mockPlugins as che.Plugin[];

describe('Samples List Gallery', () => {
  let store: Store;

  beforeEach(() => {
    store = new FakeStoreBuilder()
      .withBranding({
        docs: {
          storageTypes: 'https://docs.location',
        },
      } as BrandingData)
      .withPlugins(plugins)
      .build();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot w/ metadata', () => {
    const snapshot = createSnapshot(store, metadata);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('snapshot w/o metadata', () => {
    const snapshot = createSnapshot(store, []);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('empty state', () => {
    renderComponent(store, []);

    const cards = screen.queryAllByTestId('sample-card');
    expect(cards.length).toEqual(0);
  });

  test('gallery with cards', () => {
    renderComponent(store, metadata);

    const cards = screen.queryAllByTestId('sample-card');
    expect(cards.length).toEqual(20);
  });

  it('should handle click on card', async () => {
    renderComponent(store, metadata);

    const cards = screen.getAllByTestId('sample-card');

    const button = within(cards[0]).getByRole('button');
    await userEvent.click(button);

    expect(mockOnCardClick).toHaveBeenCalledTimes(1);
    expect(mockOnCardClick).toHaveBeenCalledWith(metadata[0]);
  });
});

function getComponent(store: Store, metadata: DevfileRegistryMetadata[]) {
  return (
    <Provider store={store}>
      <SamplesListGallery onCardClick={mockOnCardClick} metadataFiltered={metadata} />
    </Provider>
  );
}
