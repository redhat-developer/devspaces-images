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

import { screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import TemporaryStorageSwitch from '@/pages/GetStarted/SamplesList/Toolbar/TemporaryStorageSwitch';
import getComponentRenderer from '@/services/__mocks__/getComponentRenderer';
import { BrandingData } from '@/services/bootstrap/branding.constant';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

const { renderComponent, createSnapshot } = getComponentRenderer(getComponent);

const mockOnChange = jest.fn();

describe('Temporary Storage Switch', () => {
  let store: Store;

  beforeEach(() => {
    store = new FakeStoreBuilder()
      .withBranding({
        docs: {
          storageTypes: 'https://docs.location',
        },
      } as BrandingData)
      .build();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const snapshot = createSnapshot(store, false);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  it('should be initially switched on', () => {
    renderComponent(store, true);

    const switchInput = screen.getByRole('checkbox') as HTMLInputElement;
    expect(switchInput.checked).toBeTruthy();

    switchInput.click();
    expect(switchInput.checked).toBeFalsy();
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('should be initially switched off', () => {
    renderComponent(store, false);
    const switchInput = screen.getByRole('checkbox') as HTMLInputElement;
    expect(switchInput.checked).toBeFalsy();

    switchInput.click();
    expect(switchInput.checked).toBeTruthy();
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });
});

function getComponent(store: Store, isTemporary: boolean) {
  return (
    <Provider store={store}>
      <TemporaryStorageSwitch isTemporary={isTemporary} onChange={mockOnChange} />
    </Provider>
  );
}
