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
import { MockStoreEnhanced } from 'redux-mock-store';

import mockMetadata from '@/pages/GetStarted/__tests__/devfileMetadata.json';
import SamplesListToolbar from '@/pages/GetStarted/SamplesList/Toolbar';
import getComponentRenderer, { screen, waitFor } from '@/services/__mocks__/getComponentRenderer';
import { BrandingData } from '@/services/bootstrap/branding.constant';
import { che } from '@/services/models';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import * as DevfileRegistriesStore from '@/store/DevfileRegistries';

jest.mock('@/pages/GetStarted/SamplesList/Toolbar/TemporaryStorageSwitch');

const { renderComponent, createSnapshot } = getComponentRenderer(getComponent);

describe('Samples List Toolbar', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const snapshot = createSnapshot();
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  it('should initially have empty filter value', () => {
    renderComponent();
    const filterInput = screen.getByPlaceholderText('Filter by') as HTMLInputElement;
    expect(filterInput.value).toEqual('');
  });

  it('should not initially show the results counter', () => {
    renderComponent();
    const resultsCount = screen.queryByTestId('toolbar-results-count');
    expect(resultsCount).toBeNull();
  });

  it('should call "setFilter" action', async () => {
    // mock "setFilter" action
    const setFilter = DevfileRegistriesStore.actionCreators.setFilter;
    DevfileRegistriesStore.actionCreators.setFilter = jest.fn(arg => setFilter(arg));

    renderComponent();

    const filterInput = screen.getByLabelText('Filter samples list') as HTMLInputElement;
    await userEvent.click(filterInput);
    await userEvent.paste('bash');

    await waitFor(() =>
      expect(DevfileRegistriesStore.actionCreators.setFilter).toHaveBeenCalledTimes(1),
    );
    await waitFor(() =>
      expect(DevfileRegistriesStore.actionCreators.setFilter).toHaveBeenCalledWith('bash'),
    );
  });

  it('should show the results counter', async () => {
    const store = createFakeStore(mockMetadata);
    const storeNext = new FakeStoreBuilder(store)
      .withDevfileRegistries({
        filter: 'bash',
      })
      .build();
    renderComponent(storeNext);
    const filterInput = screen.getByPlaceholderText('Filter by') as HTMLInputElement;
    await userEvent.click(filterInput);
    await userEvent.paste('bash');

    await waitFor(() => screen.findByText('1 item'));
  });

  test('switch temporary storage toggle', async () => {
    renderComponent();
    const switchInput = screen.getByRole('checkbox') as HTMLInputElement;

    expect(switchInput.checked).toBeFalsy();

    await userEvent.click(switchInput);

    expect(switchInput.checked).toBeTruthy();
  });
});

function createFakeStore(metadata?: che.DevfileMetaData[]) {
  const registries = {};
  if (metadata) {
    registries['registry-location'] = {
      metadata,
    };
  }
  return new FakeStoreBuilder()
    .withBranding({
      docs: {
        storageTypes: 'https://docs.location',
      },
    } as BrandingData)
    .withDevfileRegistries({ registries })
    .build();
}

function getComponent(store?: MockStoreEnhanced) {
  store ||= createFakeStore(mockMetadata);
  return (
    <Provider store={store}>
      <SamplesListToolbar isTemporary={true} onTemporaryStorageChange={jest.fn()} />
    </Provider>
  );
}
