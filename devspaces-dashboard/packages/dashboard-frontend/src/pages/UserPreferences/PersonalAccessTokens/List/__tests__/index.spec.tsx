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

import { api } from '@eclipse-che/common';
import React from 'react';

import getComponentRenderer, {
  fireEvent,
  screen,
  within,
} from '@/services/__mocks__/getComponentRenderer';

import { PersonalAccessTokenList } from '..';

jest.mock('../Toolbar');

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnAddToken = jest.fn();
const mockOnEditToken = jest.fn();
const mockOnDeleteToken = jest.fn();

describe('PersonalAccessTokenList', () => {
  let tokens: api.PersonalAccessToken[];

  beforeEach(() => {
    tokens = [
      {
        cheUserId: 'che-user',
        gitProvider: 'github',
        gitProviderEndpoint: 'https://github.com',
        tokenData: 'token-data-1',
        tokenName: 'token-name-1',
      } as api.PersonalAccessToken,
      {
        cheUserId: 'che-user',
        gitProvider: 'azure-devops',
        gitProviderEndpoint: 'https://dev.azure.com',
        gitProviderOrganization: 'dev-azure-org',
        tokenData: 'token-data-2',
        tokenName: 'token-name-2',
      } as api.PersonalAccessToken,
    ];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should match the snapshot', () => {
    const snapshot = createSnapshot(tokens);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  describe('list head row', () => {
    test('disable head checkbox', () => {
      renderComponent(tokens, true);
      const selectAllCheckbox = screen.getByRole('checkbox', {
        name: 'Select all rows',
      });

      expect(selectAllCheckbox).toBeDisabled();
    });

    test('select all tokens', () => {
      renderComponent(tokens);
      const selectAllCheckbox = screen.getByRole('checkbox', {
        name: 'Select all rows',
      });
      const token1Checkbox = screen.getByRole('checkbox', { name: 'Select row 0' });
      const token2Checkbox = screen.getByRole('checkbox', { name: 'Select row 1' });

      // select all tokens
      fireEvent.click(selectAllCheckbox);

      expect(selectAllCheckbox).toBeChecked();
      expect(token1Checkbox).toBeChecked();
      expect(token2Checkbox).toBeChecked();

      // deselect all tokens
      fireEvent.click(selectAllCheckbox);

      expect(selectAllCheckbox).not.toBeChecked();
      expect(token1Checkbox).not.toBeChecked();
      expect(token2Checkbox).not.toBeChecked();
    });
  });

  describe('list body row', () => {
    test('disable row checkbox', () => {
      renderComponent(tokens, true);
      const selectRowCheckbox = screen.getByRole('checkbox', {
        name: 'Select row 0',
      });

      expect(selectRowCheckbox).toBeDisabled();
    });

    test('select one token', () => {
      renderComponent(tokens);
      const selectAllCheckbox = screen.getByRole('checkbox', {
        name: 'Select all rows',
      });
      const token1Checkbox = screen.getByRole('checkbox', { name: 'Select row 0' });
      const token2Checkbox = screen.getByRole('checkbox', { name: 'Select row 1' });

      // select token 1
      fireEvent.click(token1Checkbox);

      expect(selectAllCheckbox).not.toBeChecked();
      expect(token1Checkbox).toBeChecked();
      expect(token2Checkbox).not.toBeChecked();

      // select token 2
      fireEvent.click(token2Checkbox);

      expect(selectAllCheckbox).toBeChecked();
      expect(token1Checkbox).toBeChecked();
      expect(token2Checkbox).toBeChecked();

      // deselect token 1
      fireEvent.click(token1Checkbox);

      expect(selectAllCheckbox).not.toBeChecked();
      expect(token1Checkbox).not.toBeChecked();
      expect(token2Checkbox).toBeChecked();
    });
  });

  describe('toolbar buttons', () => {
    test('disable buttons', () => {
      renderComponent(tokens, true);

      const addButton = screen.getByRole('button', { name: 'Add Token' });
      const deleteButton = screen.getByRole('button', { name: 'Delete' });

      expect(addButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
    });

    test('add a new token', () => {
      renderComponent(tokens);

      expect(mockOnAddToken).not.toHaveBeenCalled();

      const button = screen.getByRole('button', { name: 'Add Token' });
      fireEvent.click(button);

      expect(mockOnAddToken).toHaveBeenCalled();
    });

    test('delete selected tokens', () => {
      renderComponent(tokens);

      expect(mockOnDeleteToken).not.toHaveBeenCalled();

      const token1Row = screen.getByRole('row', { name: new RegExp(tokens[0].tokenName) });
      const token1Checkbox = within(token1Row).getByRole('checkbox', { name: 'Select row 0' });

      const deleteButton = screen.getByRole('button', { name: 'Delete' });

      // select token 1
      fireEvent.click(token1Checkbox);

      // delete selected tokens
      fireEvent.click(deleteButton);

      expect(mockOnDeleteToken).toHaveBeenCalledWith([tokens[0]]);
    });
  });

  describe('row actions', () => {
    test('disable actions menu', () => {
      renderComponent(tokens, true);

      const token1Row = screen.getByRole('row', { name: new RegExp(tokens[0].tokenName) });
      const actionsButton = within(token1Row).getByRole('button', { name: 'Actions' });

      expect(actionsButton).toBeDisabled();
    });

    test('edit token', () => {
      renderComponent(tokens);

      expect(mockOnEditToken).not.toHaveBeenCalled();

      const token1Row = screen.getByRole('row', { name: new RegExp(tokens[0].tokenName) });
      const actionsButton = within(token1Row).getByRole('button', { name: 'Actions' });

      // open actions menu
      fireEvent.click(actionsButton);

      const token1EditButton = screen.getByRole('menuitem', { name: 'Edit Token' });

      // edit token 1
      fireEvent.click(token1EditButton);

      expect(mockOnEditToken).toHaveBeenCalledWith(tokens[0]);
    });

    test('delete token', async () => {
      renderComponent(tokens);

      expect(mockOnDeleteToken).not.toHaveBeenCalled();

      const token1Row = screen.getByRole('row', { name: new RegExp(tokens[0].tokenName) });
      const actionsButton = within(token1Row).getByRole('button', { name: 'Actions' });

      // open actions menu
      fireEvent.click(actionsButton);

      const token1DeleteButton = screen.getByRole('menuitem', { name: 'Delete Token' });

      // delete token 1
      fireEvent.click(token1DeleteButton);

      expect(mockOnDeleteToken).toHaveBeenCalledWith([tokens[0]]);
    });
  });
});

function getComponent(tokens: api.PersonalAccessToken[], isDisabled = false): React.ReactElement {
  return (
    <PersonalAccessTokenList
      isDisabled={isDisabled}
      tokens={tokens}
      onAddToken={mockOnAddToken}
      onEditToken={mockOnEditToken}
      onDeleteTokens={mockOnDeleteToken}
    />
  );
}
