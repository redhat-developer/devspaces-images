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
import { Action, Store } from 'redux';

import UntrustedSourceModal from '@/components/UntrustedSourceModal';
import getComponentRenderer, { screen, waitFor } from '@/services/__mocks__/getComponentRenderer';
import { AppThunk } from '@/store';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { WorkspacePreferencesActionCreators } from '@/store/Workspaces/Preferences';

const mockRequestPreferences = jest.fn();
const mockAddTrustedSource = jest.fn();
jest.mock('@/store/Workspaces/Preferences', () => {
  return {
    ...jest.requireActual('@/store/Workspaces/Preferences'),
    workspacePreferencesActionCreators: {
      requestPreferences: () => () => mockRequestPreferences(),
      addTrustedSource:
        (source: unknown): AppThunk<Action, Promise<void>> =>
        async (): Promise<void> =>
          mockAddTrustedSource(source),
    } as WorkspacePreferencesActionCreators,
  };
});

const mockOnContinue = jest.fn();
const mockOnClose = jest.fn();

const { renderComponent } = getComponentRenderer(getComponent);

describe('Untrusted Repo Warning Modal', () => {
  let storeBuilder: FakeStoreBuilder;

  beforeEach(() => {
    storeBuilder = new FakeStoreBuilder();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('modal is hidden', () => {
    const store = storeBuilder
      .withWorkspacePreferences({
        'trusted-sources': ['repo1', 'repo2'],
      })
      .build();
    renderComponent(store, 'source-location', false);
    const modal = screen.queryByRole('dialog');
    expect(modal).toBeNull();
  });

  test('modal is visible', () => {
    const store = storeBuilder
      .withWorkspacePreferences({
        'trusted-sources': ['repo1', 'repo2'],
      })
      .build();
    renderComponent(store, 'source-location');
    const modal = screen.queryByRole('dialog');
    expect(modal).not.toBeNull();
  });

  test('click the close button', () => {
    const store = storeBuilder
      .withWorkspacePreferences({
        'trusted-sources': ['repo1', 'repo2'],
      })
      .build();
    renderComponent(store, 'source-location');

    const closeButton = screen.getByRole('button', { name: 'Close' });

    // button is enabled
    expect(closeButton).toBeEnabled();

    closeButton.click();
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('click the cancel button', () => {
    const store = storeBuilder
      .withWorkspacePreferences({
        'trusted-sources': ['repo1', 'repo2'],
      })
      .build();
    renderComponent(store, 'source-location');

    const closeButton = screen.getByRole('button', { name: 'Cancel' });

    // button is enabled
    expect(closeButton).toBeEnabled();

    closeButton.click();
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('click the continue button', async () => {
    const store = storeBuilder
      .withWorkspacePreferences({
        'trusted-sources': ['repo1', 'repo2'],
      })
      .build();
    renderComponent(store, 'source-location');

    const continueButton = screen.getByRole('button', { name: 'Continue' });

    // button is enabled
    expect(continueButton).toBeEnabled();

    continueButton.click();

    await waitFor(() => expect(mockOnContinue).toHaveBeenCalled());

    expect(mockAddTrustedSource).toHaveBeenCalledTimes(1);
    expect(mockAddTrustedSource).toHaveBeenCalledWith('source-location');
  });

  test('trust all checkbox is clicked', () => {
    const store = storeBuilder
      .withWorkspacePreferences({
        'trusted-sources': ['repo1', 'repo2'],
      })
      .build();
    renderComponent(store, 'source-location');

    const checkbox = screen.getByRole('checkbox', {
      name: 'Do not ask me again for other repositories',
    });

    // checkbox is unchecked
    expect(checkbox).not.toBeChecked();

    checkbox.click();

    // checkbox is checked
    expect(checkbox).toBeChecked();
  });

  test('source is trusted initially', () => {
    const store = storeBuilder
      .withWorkspacePreferences({
        'trusted-sources': ['source-location'],
      })
      .build();
    renderComponent(store, 'source-location');

    // no warning window
    const modal = screen.queryByRole('dialog');
    expect(modal).toBeNull();

    expect(mockOnContinue).toHaveBeenCalledTimes(1);
  });
});

function getComponent(store: Store, location: string, isOpen = true): React.ReactElement {
  return (
    <Provider store={store}>
      <UntrustedSourceModal
        location={location}
        isOpen={isOpen}
        onContinue={mockOnContinue}
        onClose={mockOnClose}
      />
    </Provider>
  );
}
