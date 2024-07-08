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

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { api } from '@eclipse-che/common';
import userEvent from '@testing-library/user-event';
import React from 'react';

import {
  token1,
  token2,
} from '@/pages/UserPreferences/PersonalAccessTokens/DeleteModal/__tests__/stub';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

import { PersonalAccessTokenDeleteModal } from '..';

const { renderComponent } = getComponentRenderer(getComponent);

const mockOnCloseModal = jest.fn();
const mockOnDelete = jest.fn();

describe('DeleteModal', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('modal is hidden', () => {
    renderComponent(false, [token1, token2]);

    expect(screen.queryByRole('dialog')).toBeFalsy();
  });

  test('modal is visible', () => {
    renderComponent(true, [token1, token2]);

    expect(screen.queryByRole('dialog')).toBeTruthy();
  });

  it('should handle click on Close button', () => {
    renderComponent(true, [token1, token2]);

    const closeButton = screen.queryByRole('button', { name: 'Close' });
    expect(closeButton).toBeTruthy();

    userEvent.click(closeButton!);
    expect(mockOnCloseModal).toHaveBeenCalledTimes(1);
  });

  it('should handle click on Cancel button', () => {
    renderComponent(true, [token1, token2]);

    const cancelButton = screen.queryByRole('button', { name: 'Cancel' });
    expect(cancelButton).toBeTruthy();

    userEvent.click(cancelButton!);
    expect(mockOnCloseModal).toHaveBeenCalledTimes(1);
  });

  it('should handle clicks on checkbox and Delete button', () => {
    renderComponent(true, [token1, token2]);

    const deleteButton = screen.queryByRole('button', { name: 'Delete' });
    expect(deleteButton).toBeTruthy();
    expect(deleteButton).toBeDisabled();

    const checkbox = screen.queryByRole('checkbox');
    expect(checkbox).toBeTruthy();

    userEvent.click(checkbox!);
    expect(deleteButton).toBeEnabled();

    userEvent.click(deleteButton!);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });
});

function getComponent(isOpen: boolean, deleteItems: api.PersonalAccessToken[]): React.ReactElement {
  return (
    <PersonalAccessTokenDeleteModal
      isOpen={isOpen}
      deleteItems={deleteItems}
      onCloseModal={mockOnCloseModal}
      onDelete={mockOnDelete}
    />
  );
}
