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
import { RenderResult, render, screen } from '@testing-library/react';
import TemporaryStorageSwitch from '../TemporaryStorageSwitch';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import mockMetadata from '../../__tests__/devfileMetadata.json';
import { FakeStoreBuilder } from '../../../../store/__mocks__/storeBuilder';
import { BrandingData } from '../../../../services/bootstrap/branding.constant';

describe('Temporary Storage Switch', () => {
  const mockOnChange = jest.fn();

  function renderSwitch(store: Store, persistVolumesDefault: 'true' | 'false'): RenderResult {
    return render(
      <Provider store={store}>
        <TemporaryStorageSwitch
          persistVolumesDefault={persistVolumesDefault}
          onChange={mockOnChange}
        />
      </Provider>,
    );
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be initially switched on', () => {
    const store = createFakeStoreWithMetadata();
    renderSwitch(store, 'false');
    const switchInput = screen.getByRole('checkbox') as HTMLInputElement;
    expect(switchInput.checked).toBeTruthy();

    switchInput.click();
    expect(switchInput.checked).toBeFalsy();
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('should be initially switched off', () => {
    const store = createFakeStoreWithMetadata();
    renderSwitch(store, 'true');
    const switchInput = screen.getByRole('checkbox') as HTMLInputElement;
    expect(switchInput.checked).toBeFalsy();

    switchInput.click();
    expect(switchInput.checked).toBeTruthy();
    expect(mockOnChange).toHaveBeenCalledTimes(1);
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

function createFakeStoreWithMetadata(): Store {
  return createFakeStore(mockMetadata);
}
