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
import { token1, token2 } from '@/pages/UserPreferences/PersonalAccessTokens/__tests__/stub';
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
import { ActionCreators } from '@/store/PersonalAccessToken';

import PersonalAccessTokens, { State } from '..';

jest.mock('../AddEditModal');
jest.mock('../DeleteModal');
jest.mock('../List');

// mute console.error
console.error = jest.fn();

const mockShowAlert = jest.fn();

const mockRequestTokens = jest.fn();
const mockAddToken = jest.fn();
const mockUpdateToken = jest.fn();
const mockRemoveToken = jest.fn();
jest.mock('../../../../store/PersonalAccessToken', () => ({
  actionCreators: {
    addToken:
      (...args): AppThunk<Action, Promise<void>> =>
      async (): Promise<void> =>
        mockAddToken(...args),
    requestTokens:
      (...args): AppThunk<Action, Promise<void>> =>
      async (): Promise<void> =>
        mockRequestTokens(...args),
    updateToken:
      (...args): AppThunk<Action, Promise<void>> =>
      async (): Promise<void> =>
        mockUpdateToken(...args),
    removeToken:
      (...args): AppThunk<Action, Promise<void>> =>
      async (): Promise<void> =>
        mockRemoveToken(...args),
  } as ActionCreators,
}));

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

describe('PersonalAccessTokens', () => {
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

  it('should match the snapshot with no tokens', () => {
    const store = storeBuilder.build();
    const snapshot = createSnapshot(store);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  it('should match the snapshot with tokens', () => {
    const store = storeBuilder.withPersonalAccessTokens({ tokens: [token1, token2] }).build();
    const snapshot = createSnapshot(store);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  describe('empty state', () => {
    it('should render empty state when there are no tokens', () => {
      const store = storeBuilder.build();
      renderComponent(store);

      expect(screen.queryByRole('heading', { name: 'No Personal Access Tokens' })).not.toBeNull();
    });

    it('should render empty state with tokens', () => {
      const store = storeBuilder.withPersonalAccessTokens({ tokens: [token1] }).build();
      renderComponent(store);

      expect(screen.queryByRole('heading', { name: 'No Personal Access Tokens' })).toBeNull();
    });

    it('should handle add token from the empty state', () => {
      const store = storeBuilder.build();
      renderComponent(store);

      const addTokenButton = screen.getByRole('button', { name: 'Add Personal Access Token' });
      fireEvent.click(addTokenButton);

      // modal should be open
      expect(
        screen.queryByRole('heading', { name: 'Add Personal Access Token Modal' }),
      ).not.toBeNull();
    });
  });

  describe('add-edit modal', () => {
    it('should close the modal', () => {
      const store = storeBuilder.build();
      localState = { isAddEditOpen: true };
      renderComponent(store, localState);

      // modal should be open
      expect(
        screen.queryByRole('heading', { name: 'Add Personal Access Token Modal' }),
      ).not.toBeNull();

      const modal = screen.getByTestId('modal-add-edit');
      const closeButton = within(modal).getByTestId('close-modal');
      fireEvent.click(closeButton);

      // modal should be closed
      expect(screen.queryByRole('heading', { name: 'Add Personal Access Token Modal' })).toBeNull();
    });

    it('should add token, close modal and show a success notification', async () => {
      const store = storeBuilder.build();
      localState = { isAddEditOpen: true };
      renderComponent(store, localState);

      // modal should be open
      expect(
        screen.queryByRole('heading', { name: 'Add Personal Access Token Modal' }),
      ).not.toBeNull();

      const modal = screen.getByTestId('modal-add-edit');
      const saveButton = within(modal).getByTestId('save-token');
      fireEvent.click(saveButton);

      // mock onAddToken should be called
      expect(mockAddToken).toHaveBeenCalled();

      // modal should be closed
      expect(screen.queryByRole('heading', { name: 'Add Personal Access Token Modal' })).toBeNull();

      // success alert should be shown
      await waitFor(() =>
        expect(mockShowAlert).toHaveBeenCalledWith({
          key: 'save-token-success',
          title: 'Token saved successfully.',
          variant: 'success',
        } as AlertItem),
      );
    });

    it('should edit token, close modal and show a success notification', async () => {
      const store = storeBuilder.build();
      localState = { isAddEditOpen: true, editToken: token1 };
      renderComponent(store, localState);

      // modal should be open
      expect(
        screen.queryByRole('heading', { name: 'Edit Personal Access Token Modal' }),
      ).not.toBeNull();

      const modal = screen.getByTestId('modal-add-edit');
      const saveButton = within(modal).getByTestId('save-token');
      fireEvent.click(saveButton);

      // mock onUpdateToken should be called
      expect(mockUpdateToken).toHaveBeenCalled();

      // modal should be closed
      expect(
        screen.queryByRole('heading', { name: 'Edit Personal Access Token Modal' }),
      ).toBeNull();

      // success alert should be shown
      await waitFor(() =>
        expect(mockShowAlert).toHaveBeenCalledWith({
          key: 'save-token-success',
          title: 'Token saved successfully.',
          variant: 'success',
        } as AlertItem),
      );
    });

    it('should try to save token, close modal and show alert notification', async () => {
      const store = storeBuilder.build();
      localState = { isAddEditOpen: true };
      renderComponent(store, localState);

      // modal should be open
      expect(
        screen.queryByRole('heading', { name: 'Add Personal Access Token Modal' }),
      ).not.toBeNull();

      const modal = screen.getByTestId('modal-add-edit');
      const saveButton = within(modal).getByTestId('save-token');

      mockAddToken.mockRejectedValueOnce(new Error('Error'));
      fireEvent.click(saveButton);

      // mock onAddToken should be called
      expect(mockAddToken).toHaveBeenCalled();

      // modal should be closed
      expect(screen.queryByRole('heading', { name: 'Add Personal Access Token Modal' })).toBeNull();
    });
  });

  describe('delete modal', () => {
    it('should close the modal', () => {
      const store = storeBuilder.withPersonalAccessTokens({ tokens: [token1, token2] }).build();
      localState = { isDeleteOpen: true };
      renderComponent(store, localState);

      // modal should be open
      expect(
        screen.queryByRole('heading', { name: 'Delete Personal Access Token Modal' }),
      ).not.toBeNull();

      const modal = screen.getByTestId('modal-delete');
      const closeButton = within(modal).getByTestId('close-modal');
      fireEvent.click(closeButton);

      // modal should be closed
      expect(
        screen.queryByRole('heading', { name: 'Delete Personal Access Token Modal' }),
      ).toBeNull();
    });

    it('should delete one token, close modal and show a success notification', async () => {
      const store = storeBuilder.build();
      localState = { isDeleteOpen: true, deleteTokens: [token1] };
      renderComponent(store, localState);

      // modal should be open
      expect(
        screen.queryByRole('heading', { name: 'Delete Personal Access Token Modal' }),
      ).not.toBeNull();

      const modal = screen.getByTestId('modal-delete');
      const deleteButton = within(modal).getByTestId('delete-tokens');
      fireEvent.click(deleteButton);

      // mock onRemoveToken should be called
      await waitFor(() => expect(mockRemoveToken).toHaveBeenCalled());

      // modal should be closed
      expect(
        screen.queryByRole('heading', { name: 'Delete Personal Access Token Modal' }),
      ).toBeNull();

      // success alert should be shown
      await waitFor(() =>
        expect(mockShowAlert).toHaveBeenCalledWith({
          key: 'delete-tokens-success',
          title: '1 token deleted successfully',
          variant: 'success',
        } as AlertItem),
      );
    });

    it('should delete 1 of 2 tokens, close modal and show alert notifications', async () => {
      const store = storeBuilder.build();
      localState = { isDeleteOpen: true, deleteTokens: [token1, token2] };
      renderComponent(store, localState);

      // modal should be open
      expect(
        screen.queryByRole('heading', { name: 'Delete Personal Access Token Modal' }),
      ).not.toBeNull();

      const modal = screen.getByTestId('modal-delete');
      const deleteButton = within(modal).getByTestId('delete-tokens');

      mockRemoveToken.mockRejectedValueOnce(new Error('error'));
      mockRemoveToken.mockResolvedValueOnce(token1);
      fireEvent.click(deleteButton);

      // mock onRemoveToken should be called
      expect(mockRemoveToken).toHaveBeenCalledTimes(2);

      // modal should be closed
      expect(
        screen.queryByRole('heading', { name: 'Delete Personal Access Token Modal' }),
      ).toBeNull();

      // two alerts should be shown
      await waitFor(() => expect(mockShowAlert).toHaveBeenCalledTimes(2));
      expect(mockShowAlert).toHaveBeenNthCalledWith(1, {
        key: 'delete-tokens-success',
        title: '1 of 2 tokens deleted successfully',
        variant: 'success',
      } as AlertItem);
      expect(mockShowAlert).toHaveBeenNthCalledWith(2, {
        key: 'delete-tokens-error',
        title: 'Failed to delete 1 token',
        variant: 'danger',
      } as AlertItem);
    });
  });

  describe('list', () => {
    it('should handle add token from the list', () => {
      const store = storeBuilder.withPersonalAccessTokens({ tokens: [token1, token2] }).build();
      renderComponent(store);

      const list = screen.getByTestId('token-list');

      const addTokenButton = within(list).getByRole('button', { name: 'Add Token' });
      fireEvent.click(addTokenButton);

      // modal should be open
      expect(
        screen.queryByRole('heading', { name: 'Add Personal Access Token Modal' }),
      ).not.toBeNull();
    });

    it('should handle edit token from the list', () => {
      const store = storeBuilder.withPersonalAccessTokens({ tokens: [token1, token2] }).build();
      renderComponent(store);

      const rows = screen.getAllByTestId('token-row');

      const editTokenButton = within(rows[0]).getByRole('button', { name: 'Edit Token' });
      fireEvent.click(editTokenButton);

      // modal should be open
      expect(
        screen.queryByRole('heading', { name: 'Edit Personal Access Token Modal' }),
      ).not.toBeNull();
    });

    it('should handle delete token from the list', () => {
      const store = storeBuilder.withPersonalAccessTokens({ tokens: [token1, token2] }).build();
      renderComponent(store);

      const rows = screen.getAllByTestId('token-row');

      const deleteTokenButton = within(rows[0]).getByRole('button', { name: 'Delete Token' });
      fireEvent.click(deleteTokenButton);

      // modal should be open
      expect(
        screen.queryByRole('heading', { name: 'Delete Personal Access Token Modal' }),
      ).not.toBeNull();
    });

    it('should propagate isDisabled to the list when isLoading is true', () => {
      const isLoading = true;
      const store = storeBuilder
        .withPersonalAccessTokens({ tokens: [token1, token2] }, isLoading)
        .build();
      renderComponent(store);

      const tokenList = screen.getByTestId('token-list');
      const deleteAllButton = within(tokenList).getByRole('button', { name: 'Delete' });

      expect(deleteAllButton).toBeDisabled();
    });

    it('should propagate isDisabled to the list when isDeleting is true', () => {
      const isLoading = false;
      const store = storeBuilder
        .withPersonalAccessTokens({ tokens: [token1, token2] }, isLoading)
        .build();
      localState = { isDeleting: true };
      renderComponent(store, localState);

      const tokenList = screen.getByTestId('token-list');
      const deleteAllButton = within(tokenList).getByRole('button', { name: 'Delete' });

      expect(deleteAllButton).toBeDisabled();
    });
  });

  describe('component updated', () => {
    it('should report error when fetching Che user ID fails', async () => {
      const store = storeBuilder.build();
      const { reRenderComponent } = renderComponent(store);

      const errorMessage = 'fetch-user-id-error';
      const nextStore = new FakeStoreBuilder()
        .withCheUserId({ cheUserId: '', error: errorMessage }, false)
        .build();
      reRenderComponent(nextStore);

      await waitFor(() => expect(mockShowAlert).toHaveBeenCalled());
      expect(mockShowAlert).toHaveBeenCalledWith({
        key: 'che-user-id-error',
        title: `Failed to load user ID. ${errorMessage}`,
        variant: 'danger',
      } as AlertItem);
    });

    it('should report error when fetching tokens fails', async () => {
      const store = storeBuilder.build();
      const { reRenderComponent } = renderComponent(store);

      const errorMessage = 'fetch-tokens-error';
      const nextStore = new FakeStoreBuilder()
        .withPersonalAccessTokens({ tokens: [], error: errorMessage }, false)
        .build();
      reRenderComponent(nextStore);

      await waitFor(() => expect(mockShowAlert).toHaveBeenCalled());
      expect(mockShowAlert).toHaveBeenCalledWith({
        key: 'personal-access-tokens-error',
        title: errorMessage,
        variant: 'danger',
      } as AlertItem);
    });
  });
});

function getComponent(store: Store, localState?: Partial<State>): React.ReactElement {
  const component = <PersonalAccessTokens />;
  if (localState) {
    return (
      <Provider store={store}>
        <StateMock state={localState}>{component}</StateMock>
      </Provider>
    );
  } else {
    return (
      <Provider store={store}>
        <PersonalAccessTokens />
      </Provider>
    );
  }
}
