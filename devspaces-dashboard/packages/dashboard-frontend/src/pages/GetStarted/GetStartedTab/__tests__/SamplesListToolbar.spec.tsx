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

import React from 'react';
import { RenderResult, render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import SamplesListToolbar from '../SamplesListToolbar';
import mockMetadata from '../../__tests__/devfileMetadata.json';
import * as DevfileRegistriesStore from '../../../../store/DevfileRegistries';
import { FakeStoreBuilder } from '../../../../store/__mocks__/storeBuilder';
import { BrandingData } from '../../../../services/bootstrap/branding.constant';

describe('Samples List Toolbar', () => {
  function renderToolbar(): RenderResult {
    // eslint-disable-next-line
    const store = createFakeStore(mockMetadata);
    return render(
      <Provider store={store}>
        <SamplesListToolbar persistVolumesDefault={'false'} onTemporaryStorageChange={jest.fn()} />
      </Provider>,
    );
  }

  it('should initially have empty filter value', () => {
    renderToolbar();
    const filterInput = screen.getByPlaceholderText('Filter by') as HTMLInputElement;
    expect(filterInput.value).toEqual('');
  });

  it('should not initially show the results counter', () => {
    renderToolbar();
    const resultsCount = screen.queryByTestId('toolbar-results-count');
    expect(resultsCount).toBeNull();
  });

  it('should call "setFilter" action', () => {
    // mock "setFilter" action
    const setFilter = DevfileRegistriesStore.actionCreators.setFilter;
    DevfileRegistriesStore.actionCreators.setFilter = jest.fn(arg => setFilter(arg));

    renderToolbar();

    const filterInput = screen.getByLabelText('Filter samples list') as HTMLInputElement;
    fireEvent.change(filterInput, { target: { value: 'NodeJS Angular Web Application' } });

    expect(DevfileRegistriesStore.actionCreators.setFilter).toHaveBeenCalledTimes(1);
    expect(DevfileRegistriesStore.actionCreators.setFilter).toHaveBeenCalledWith(
      'NodeJS Angular Web Application',
    );
  });
});

function createFakeStore(metadata?: che.DevfileMetaData[]): Store {
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
