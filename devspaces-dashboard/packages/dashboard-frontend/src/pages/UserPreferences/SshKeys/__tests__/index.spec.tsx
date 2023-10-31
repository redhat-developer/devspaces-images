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

import { StateMock } from '@react-mock/state';
import React from 'react';
import { Provider } from 'react-redux';
import { Action, Store } from 'redux';

import { container } from '@/inversify.config';
import { sshKey1, sshKey2 } from '@/pages/UserPreferences/SshKeys/__tests__/stub';
import {
  MODAL_ADD_CLOSE_BUTTON_TEST_ID,
  MODAL_ADD_SUBMIT_BUTTON_TEST_ID,
  MODAL_ADD_TEST_ID,
} from '@/pages/UserPreferences/SshKeys/AddModal/__mocks__';
import getComponentRenderer, {
  fireEvent,
  screen,
  waitFor,
  within,
} from '@/services/__mocks__/getComponentRenderer';
import { AppAlerts } from '@/services/alerts/appAlerts';
import { AlertItem } from '@/services/helpers/types';
import { AppThunk } from '@/store';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { ActionCreators } from '@/store/SshKeys';

import SshKeys, { State } from '..';

jest.mock('../AddModal');
jest.mock('../DeleteModal');
jest.mock('../List');

// mute console.error
console.error = jest.fn();

const mockShowAlert = jest.fn();

const mockRequestSshKeys = jest.fn();
const mockAddSshKeys = jest.fn();
const mockRemoveSshKey = jest.fn();
jest.mock('../../../../store/SshKeys', () => ({
  actionCreators: {
    addSshKey:
      (...args): AppThunk<Action, Promise<void>> =>
      async (): Promise<void> =>
        mockAddSshKeys(...args),
    requestSshKeys:
      (...args): AppThunk<Action, Promise<void>> =>
      async (): Promise<void> =>
        mockRequestSshKeys(...args),
    removeSshKey:
      (...args): AppThunk<Action, Promise<void>> =>
      async (): Promise<void> =>
        mockRemoveSshKey(...args),
  } as ActionCreators,
}));

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

describe('SshKeys', () => {
  let storeBuilder: FakeStoreBuilder;
  let localState: Partial<State>;

  beforeEach(() => {
    storeBuilder = new FakeStoreBuilder();

    class MockAppAlerts extends AppAlerts {
      showAlert(alert: AlertItem): void {
        mockShowAlert(alert);
      }
    }

    container.snapshot();
    container.rebind(AppAlerts).to(MockAppAlerts).inSingletonScope();
  });

  afterEach(() => {
    jest.clearAllMocks();
    container.restore();
    localState = {};
  });

  it('should match the snapshot with no SSH keys', () => {
    const store = storeBuilder.build();
    const snapshot = createSnapshot(store);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  it('should match the snapshot with SSH keys', () => {
    const store = storeBuilder.withSshKeys({ keys: [sshKey1, sshKey2] }).build();
    const snapshot = createSnapshot(store);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  describe('empty state', () => {
    it('should render empty state when there are no SSH keys', () => {
      const store = storeBuilder.build();
      renderComponent(store);

      expect(screen.queryByRole('heading', { name: 'No SSH Keys' })).not.toBeNull();
    });

    it('should not render empty state with SSH keys', () => {
      const store = storeBuilder.withSshKeys({ keys: [sshKey1] }).build();
      renderComponent(store);

      expect(screen.queryByRole('heading', { name: 'No SSH Keys' })).toBeNull();
    });

    it('should handle add SSH key from the empty state', () => {
      const store = storeBuilder.build();
      renderComponent(store);

      const addSshKeyButton = screen.getByRole('button', { name: 'Add SSH Key' });
      fireEvent.click(addSshKeyButton);

      // modal should be open
      expect(screen.queryByRole('heading', { name: 'Add SSH Keys Modal' })).not.toBeNull();
    });
  });

  describe('add modal', () => {
    it('should close the modal', () => {
      const store = storeBuilder.withSshKeys({ keys: [sshKey1, sshKey2] }).build();
      localState = { isAddOpen: true };
      renderComponent(store, localState);

      // modal should be open
      expect(screen.queryByRole('heading', { name: 'Add SSH Keys Modal' })).not.toBeNull();

      const modal = screen.getByTestId(MODAL_ADD_TEST_ID);
      const closeButton = within(modal).getByTestId(MODAL_ADD_CLOSE_BUTTON_TEST_ID);
      fireEvent.click(closeButton);

      // modal should be closed
      expect(screen.queryByRole('heading', { name: 'Add SSH Keys Modal' })).toBeNull();
    });

    it('should add SSH key, close modal and show a success notification', async () => {
      const store = storeBuilder.build();
      localState = { isAddOpen: true };
      renderComponent(store, localState);

      // modal should be open
      expect(screen.queryByRole('heading', { name: 'Add SSH Keys Modal' })).not.toBeNull();

      const modal = screen.getByTestId(MODAL_ADD_TEST_ID);
      const submitButton = within(modal).getByTestId(MODAL_ADD_SUBMIT_BUTTON_TEST_ID);
      fireEvent.click(submitButton);

      // mock onAddSshKey should be called
      await waitFor(() => expect(mockAddSshKeys).toHaveBeenCalled());

      // modal should be closed
      expect(screen.queryByRole('heading', { name: 'Add SSH Keys Modal' })).toBeNull();

      // success alert should be shown
      await waitFor(() =>
        expect(mockShowAlert).toHaveBeenCalledWith({
          key: 'save-ssh-keys-success',
          title: 'SSH keys saved successfully.',
          variant: 'success',
        } as AlertItem),
      );
    });
  });

  describe('delete modal', () => {
    it('should close the modal', () => {
      const store = storeBuilder.withSshKeys({ keys: [sshKey1, sshKey2] }).build();
      localState = { isDeleteOpen: true };
      renderComponent(store, localState);

      // modal should be open
      expect(screen.queryByRole('heading', { name: 'Delete SSH Keys Modal' })).not.toBeNull();

      const modal = screen.getByTestId('modal-delete');
      const closeButton = within(modal).getByTestId('close-modal');
      fireEvent.click(closeButton);

      // modal should be closed
      expect(screen.queryByRole('heading', { name: 'Delete SSH Keys Modal' })).toBeNull();
    });

    it('should delete one SSH key, close modal and show a success notification', async () => {
      const store = storeBuilder.build();
      localState = { isDeleteOpen: true, deleteKeys: [sshKey1] };
      renderComponent(store, localState);

      // modal should be open
      expect(screen.queryByRole('heading', { name: 'Delete SSH Keys Modal' })).not.toBeNull();

      const modal = screen.getByTestId('modal-delete');
      const deleteButton = within(modal).getByTestId('delete-ssh-keys');
      fireEvent.click(deleteButton);

      // mock onRemoveSshKey should be called
      await waitFor(() => expect(mockRemoveSshKey).toHaveBeenCalled());

      // modal should be closed
      expect(screen.queryByRole('heading', { name: 'Delete SSH Keys Modal' })).toBeNull();

      // success alert should be shown
      await waitFor(() =>
        expect(mockShowAlert).toHaveBeenCalledWith({
          key: 'delete-ssh-keys-success',
          title: '1 pair of SSH keys deleted successfully.',
          variant: 'success',
        } as AlertItem),
      );
    });

    it('should delete 1 of 2 SSH keys, close modal and show alert notifications', async () => {
      const store = storeBuilder.build();
      localState = { isDeleteOpen: true, deleteKeys: [sshKey1, sshKey2] };
      renderComponent(store, localState);

      // modal should be open
      expect(screen.queryByRole('heading', { name: 'Delete SSH Keys Modal' })).not.toBeNull();

      const modal = screen.getByTestId('modal-delete');
      const deleteButton = within(modal).getByTestId('delete-ssh-keys');

      mockRemoveSshKey.mockRejectedValueOnce(new Error('error'));
      mockRemoveSshKey.mockResolvedValueOnce(sshKey1);
      fireEvent.click(deleteButton);

      // mock onRemoveSshKeys should be called
      expect(mockRemoveSshKey).toHaveBeenCalledTimes(2);

      // modal should be closed
      expect(screen.queryByRole('heading', { name: 'Delete SSH Keys Modal' })).toBeNull();

      // two alerts should be shown
      await waitFor(() => expect(mockShowAlert).toHaveBeenCalledTimes(2));
      expect(mockShowAlert).toHaveBeenNthCalledWith(1, {
        key: 'delete-ssh-keys-success',
        title: '1 of 2 pairs of SSH keys deleted successfully.',
        variant: 'success',
      } as AlertItem);
      expect(mockShowAlert).toHaveBeenNthCalledWith(2, {
        key: 'delete-ssh-keys-error',
        title: 'Failed to delete 1 pair of SSH keys.',
        variant: 'danger',
      } as AlertItem);
    });
  });

  describe('list', () => {
    it('should handle delete SSH key from the list', () => {
      const store = storeBuilder.withSshKeys({ keys: [sshKey1, sshKey2] }).build();
      renderComponent(store);

      const entries = screen.getAllByTestId('ssh-keys-list-entry');

      const deleteSshKeyButton = within(entries[0]).getByRole('button', { name: 'Delete' });
      fireEvent.click(deleteSshKeyButton);

      // modal should be open
      expect(screen.queryByRole('heading', { name: 'Delete SSH Keys Modal' })).not.toBeNull();
    });
  });

  describe('component updated', () => {
    it('should report error when fetching SSH keys fails', async () => {
      const store = storeBuilder.build();
      const { reRenderComponent } = renderComponent(store);

      const errorMessage = 'fetch-ssh-keys-error';
      const nextStore = new FakeStoreBuilder()
        .withSshKeys({ keys: [], error: errorMessage }, false)
        .build();
      reRenderComponent(nextStore);

      await waitFor(() => expect(mockShowAlert).toHaveBeenCalled());
      expect(mockShowAlert).toHaveBeenCalledWith({
        key: 'ssh-keys-error',
        title: errorMessage,
        variant: 'danger',
      } as AlertItem);
    });
  });
});

function getComponent(store: Store, localState?: Partial<State>): React.ReactElement {
  const component = <SshKeys />;
  if (localState) {
    return (
      <Provider store={store}>
        <StateMock state={localState}>{component}</StateMock>
      </Provider>
    );
  } else {
    return (
      <Provider store={store}>
        <SshKeys />
      </Provider>
    );
  }
}
