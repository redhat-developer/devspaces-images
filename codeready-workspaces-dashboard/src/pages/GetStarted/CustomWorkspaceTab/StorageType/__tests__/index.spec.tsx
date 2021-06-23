/*
 * Copyright (c) 2018-2020 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { Provider } from 'react-redux';
import { RenderResult, render, fireEvent, screen } from '@testing-library/react';
import React from 'react';

import StorageTypeFormGroup from '../';
import { toTitle } from '../../../../../services/storageTypes';
import { FakeStoreBuilder } from '../../../../../store/__mocks__/storeBuilder';

describe('Storage Type Selector', () => {

  const mockOnChange = jest.fn();

  function renderSelector(storageType: che.WorkspaceStorageType): RenderResult {
    const store = buildStore(storageType);

    return render(
      <Provider store={store}>
        <StorageTypeFormGroup
          storageType={storageType}
          onChange={mockOnChange}
        />
      </Provider>
    );
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the Storage Type selector with "async" type chosen', () => {
    const defaultStorageType: che.WorkspaceStorageType = 'async';
    renderSelector(defaultStorageType);

    const optionToggleElement = screen.getByText(toTitle(defaultStorageType));
    expect(optionToggleElement).toBeVisible();
  });

  it('should render the Storage Type selector with "ephemeral" type chosen', () => {
    const defaultStorageType: che.WorkspaceStorageType = 'ephemeral';
    renderSelector(defaultStorageType);

    const optionToggleElement = screen.getByText(toTitle(defaultStorageType));
    expect(optionToggleElement).toBeVisible();
  });

  it('should render the Storage Type selector with "persistent" type chosen', () => {
    const defaultStorageType: che.WorkspaceStorageType = 'persistent';
    renderSelector(defaultStorageType);

    const optionToggleElement = screen.getByText(toTitle(defaultStorageType));
    expect(optionToggleElement).toBeVisible();
  });

  it('should render options list', () => {
    const defaultStorageType: che.WorkspaceStorageType = 'persistent';
    renderSelector(defaultStorageType);

    // perform click on toggle button to show list of options
    const optionToggleElement = screen.getByRole('button', { name: toTitle(defaultStorageType) });
    fireEvent.click(optionToggleElement);

    const options = screen.getAllByRole('option');

    expect(options.length).toEqual(3);

    expect(options[0].innerHTML).toMatch(toTitle('async'));
    expect(options[1].innerHTML).toMatch(toTitle('ephemeral'));
    expect(options[2].innerHTML).toMatch(toTitle('persistent'));
  });

  it('should switch to another storage type by choosing corresponding option', () => {
    const defaultStorageType: che.WorkspaceStorageType = 'persistent';
    const nextStorageType: che.WorkspaceStorageType = 'ephemeral';
    const selector = renderSelector(defaultStorageType);

    // click on toggle button to expand the list of options
    const optionToggleElement = selector.getByRole('button', { name: toTitle(defaultStorageType) });
    fireEvent.click(optionToggleElement);

    // click on option element to choose it
    const nextOptionElement = selector.getByText(toTitle(nextStorageType));
    expect(nextOptionElement).toBeVisible();
    fireEvent.click(nextOptionElement);

    const nextToggleElement = selector.getByRole('button', { name: toTitle(nextStorageType) });
    expect(nextToggleElement).toBeVisible();

    expect(mockOnChange).toHaveBeenCalledWith(nextStorageType);
  });

  it('should handle storage type property changing', () => {
    const defaultStorageType: che.WorkspaceStorageType = 'persistent';
    const nextStorageType: che.WorkspaceStorageType = 'ephemeral';
    const { rerender } = renderSelector(defaultStorageType);

    const store = buildStore(defaultStorageType);
    rerender(
      <Provider store={store}>
        <StorageTypeFormGroup
          storageType={nextStorageType}
          onChange={mockOnChange}
        />
      </Provider>
    );

    const nextToggleElement = screen.getByRole('button', { name: toTitle(nextStorageType) });
    expect(nextToggleElement).toBeVisible();
  });

  it('should open modal box with descriptions', () => {
    const defaultStorageType: che.WorkspaceStorageType = 'persistent';
    renderSelector(defaultStorageType);

    // click to open modal dialog
    const linkButton = screen.getByRole('button', { name: /learn more/i });
    expect(linkButton).toBeVisible();
    fireEvent.click(linkButton);

    const modalBox = screen.getByRole('dialog');
    expect(modalBox).toBeVisible();

    // link to docs
    const link = screen.getByRole('link', { name: /open documentation/i });
    expect(link).toBeVisible();
    expect(link.getAttribute('href')).toEqual('https://che-docs/storage-types');
  });

});

function buildStore(storageType: string) {
  const settings: che.WorkspaceSettings = {
    'che.workspace.storage.available_types': 'async,ephemeral,persistent',
    'che.workspace.storage.preferred_type': storageType
  } as che.WorkspaceSettings;
  const branding = {
    docs: {
      storageTypes: 'https://che-docs/storage-types'
    }
  } as any;

  const store = new FakeStoreBuilder()
    .withBranding(branding)
    .withWorkspacesSettings(settings)
    .build();
  return store;
}
