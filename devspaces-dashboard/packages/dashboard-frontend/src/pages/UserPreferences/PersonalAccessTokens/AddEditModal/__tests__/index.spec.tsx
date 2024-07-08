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
  SUBMIT_INVALID_FORM,
  SUBMIT_VALID_FORM,
} from '@/pages/UserPreferences/PersonalAccessTokens/AddEditModal/Form/__mocks__';
import { EditTokenProps } from '@/pages/UserPreferences/PersonalAccessTokens/types';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

import { PersonalAccessTokenAddEditModal } from '..';

const { renderComponent } = getComponentRenderer(getComponent);

jest.mock('../Form');

const mockOnSave = jest.fn();
const mockOnClose = jest.fn();

const cheUserId = 'user-che';

describe('AddEditModal', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('modal is hidden', () => {
    renderComponent(false, { isEdit: false, token: undefined });

    expect(screen.queryByRole('dialog')).toBeFalsy();
  });

  test('modal is visible', () => {
    renderComponent(true, { isEdit: false, token: undefined });

    expect(screen.queryByRole('dialog')).toBeTruthy();
  });

  it('should handle click on Close button', () => {
    renderComponent(true, { isEdit: false, token: undefined });

    const closeButton = screen.queryByRole('button', { name: 'Close' });
    expect(closeButton).toBeTruthy();

    userEvent.click(closeButton!);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should handle click on Cancel button', () => {
    renderComponent(true, { isEdit: false, token: undefined });

    const cancelButton = screen.queryByRole('button', { name: 'Cancel' });
    expect(cancelButton).toBeTruthy();

    userEvent.click(cancelButton!);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  describe('modal in add mode', () => {
    const isEdit = false;
    const isOpen = true;

    test('modal title', () => {
      renderComponent(isOpen, { isEdit, token: undefined });

      expect(
        screen.queryByRole('heading', {
          name: 'Add Personal Access Token',
        }),
      ).toBeTruthy();
    });

    test('modal footer', () => {
      renderComponent(isOpen, { isEdit, token: undefined });

      expect(
        screen.queryByRole('button', {
          name: 'Add',
        }),
      ).toBeTruthy();
      expect(
        screen.queryByRole('button', {
          name: 'Cancel',
        }),
      ).toBeTruthy();
    });
  });

  describe('modal in edit mode', () => {
    const isEdit = true;
    const isOpen = true;
    const token = {} as api.PersonalAccessToken;

    test('modal title', () => {
      renderComponent(isOpen, { isEdit, token });

      expect(
        screen.queryByRole('heading', {
          name: 'Edit Personal Access Token',
        }),
      ).toBeTruthy();
    });

    test('modal footer', () => {
      renderComponent(isOpen, { isEdit, token });

      expect(
        screen.queryByRole('button', {
          name: 'Save',
        }),
      ).toBeTruthy();
      expect(
        screen.queryByRole('button', {
          name: 'Cancel',
        }),
      ).toBeTruthy();
    });
  });

  describe('should handle saving personal access token', () => {
    const isEdit = false;
    const isOpen = true;

    it('should handle valid personal access token', () => {
      renderComponent(isOpen, { isEdit, token: undefined });

      // expect add button to be disabled
      const addButton = screen.getByRole('button', { name: 'Add' });
      expect(addButton).toBeDisabled();

      const SubmitValidFormButton = screen.getByRole('button', {
        name: SUBMIT_VALID_FORM,
      });
      userEvent.click(SubmitValidFormButton);

      // expect add button to be enabled
      expect(addButton).toBeEnabled();

      userEvent.click(addButton);

      // expect onSave to be called
      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid personal access token', () => {
      renderComponent(isOpen, { isEdit, token: undefined });

      // expect add button to be enabled
      const addButton = screen.getByRole('button', { name: 'Add' });
      expect(addButton).toBeDisabled();

      const SubmitInvalidFormButton = screen.getByRole('button', {
        name: SUBMIT_INVALID_FORM,
      });
      userEvent.click(SubmitInvalidFormButton);

      // expect add button to be disabled
      expect(addButton).toBeDisabled();
    });
  });
});

function getComponent(isOpen: boolean, props: EditTokenProps): React.ReactElement {
  return (
    <PersonalAccessTokenAddEditModal
      cheUserId={cheUserId}
      isOpen={isOpen}
      onSaveToken={mockOnSave}
      onCloseModal={mockOnClose}
      {...props}
    />
  );
}
