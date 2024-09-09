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

import { StateMock } from '@react-mock/state';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import StorageTypeFormGroup, { State } from '@/pages/WorkspaceDetails/OverviewTab/StorageType';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';
import { BrandingData } from '@/services/bootstrap/branding.constant';
import { che } from '@/services/models';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnSave = jest.fn();

describe('StorageTypeFormGroup', () => {
  let store: Store;

  beforeEach(() => {
    store = new FakeStoreBuilder()
      .withBranding({
        docs: {
          storageTypes: 'storage-types-docs',
        },
      } as BrandingData)
      .withDwServerConfig({
        defaults: {
          pvcStrategy: 'per-workspace',
          components: [],
          editor: undefined,
          plugins: [],
        },
      })
      .build();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('readonly storage type', () => {
    const readonly = true;

    test('screenshot', () => {
      const snapshot = createSnapshot(store, { readonly });
      expect(snapshot.toJSON()).toMatchSnapshot();
    });
  });

  describe('editable storage type', () => {
    const readonly = false;

    test('screenshot', () => {
      const snapshot = createSnapshot(store, { readonly });
      expect(snapshot.toJSON()).toMatchSnapshot();
    });

    describe('storage type info modal dialog', () => {
      test('show modal', async () => {
        renderComponent(store, { readonly });

        const button = screen.queryByRole('button', { name: 'Storage Type Info' });
        expect(button).not.toBeNull();

        await userEvent.click(button!);

        const modal = screen.queryByRole('dialog', { name: 'Storage Type Info' });
        const buttonClose = screen.queryByRole('button', { name: 'Close' });
        const documentationLink = screen.queryByRole('link', { name: 'Open documentation page' });

        expect(modal).not.toBeNull();
        expect(buttonClose).not.toBeNull();
        expect(documentationLink).not.toBeNull();
      });

      test('close modal dialog', async () => {
        renderComponent(store, { readonly }, { isInfoOpen: true });

        // modal is opened
        expect(screen.queryByRole('dialog', { name: 'Storage Type Info' })).not.toBeNull();

        const buttonClose = screen.getByRole('button', { name: 'Close' });

        await userEvent.click(buttonClose!);

        // modal is closed
        expect(screen.queryByRole('dialog', { name: 'Storage Type Info' })).toBeNull();
      });
    });

    describe('change storage type modal dialog', () => {
      test('show modal', async () => {
        renderComponent(store, { readonly });

        const button = screen.queryByRole('button', { name: 'Change Storage Type' });
        expect(button).not.toBeNull();

        await userEvent.click(button!);

        const modal = screen.queryByRole('dialog', { name: 'Change Storage Type' });
        const buttonSave = screen.queryByRole('button', { name: 'Save' });
        const buttonClose = screen.queryByRole('button', { name: 'Close' });
        const buttonCancel = screen.queryByRole('button', { name: 'Cancel' });

        expect(modal).not.toBeNull();
        expect(buttonSave).not.toBeNull();
        expect(buttonClose).not.toBeNull();
        expect(buttonCancel).not.toBeNull();
      });

      test('close modal dialog', async () => {
        renderComponent(store, { readonly }, { isSelectorOpen: true });

        // modal is opened
        expect(screen.queryByRole('dialog', { name: 'Change Storage Type' })).not.toBeNull();

        const buttonClose = screen.getByRole('button', { name: 'Close' });

        await userEvent.click(buttonClose!);

        // modal is closed
        expect(screen.queryByRole('dialog', { name: 'Change Storage Type' })).toBeNull();
      });

      test('change storage type', async () => {
        renderComponent(store, { readonly, storageType: 'ephemeral' }, { isSelectorOpen: true });

        const radioPerWorkspace = screen.getByRole('radio', { name: 'Per-workspace' });
        const buttonSave = screen.getByRole('button', { name: 'Save' });

        await userEvent.click(radioPerWorkspace);
        await userEvent.click(buttonSave);

        // modal is closed
        expect(screen.queryByRole('dialog', { name: 'Change Storage Type' })).toBeNull();

        expect(mockOnSave).toHaveBeenCalledWith('per-workspace');
      });
    });
  });
});

function getComponent(
  store: Store,
  props: { readonly: boolean; storageType?: che.WorkspaceStorageType },
  state?: Partial<State>,
) {
  if (state) {
    return (
      <Provider store={store}>
        <StateMock state={state}>
          <StorageTypeFormGroup
            onSave={mockOnSave}
            readonly={props.readonly}
            storageType={props.storageType}
          />
        </StateMock>
      </Provider>
    );
  } else {
    return (
      <Provider store={store}>
        <StorageTypeFormGroup
          onSave={mockOnSave}
          readonly={props.readonly}
          storageType={props.storageType}
        />
      </Provider>
    );
  }
}
