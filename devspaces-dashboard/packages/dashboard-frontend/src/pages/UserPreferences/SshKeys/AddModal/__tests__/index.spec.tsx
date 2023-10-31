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

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import userEvent from '@testing-library/user-event';
import React from 'react';

import {
  SUBMIT_INVALID_FORM,
  SUBMIT_VALID_FORM,
} from '@/pages/UserPreferences/SshKeys/AddModal/Form/__mocks__';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

import { SshKeysAddModal } from '..';

const { renderComponent } = getComponentRenderer(getComponent);

jest.mock('../Form');

const mockOnSave = jest.fn();
const mockOnClose = jest.fn();

describe('AddModal', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('modal is hidden', () => {
    renderComponent(false);

    expect(screen.queryByRole('dialog')).toBeFalsy();
  });

  test('modal is visible', () => {
    renderComponent(true);

    expect(screen.queryByRole('dialog')).toBeTruthy();
  });

  it('should handle click on Close button', () => {
    renderComponent(true);

    const closeButton = screen.queryByRole('button', { name: 'Close' });
    expect(closeButton).toBeTruthy();

    userEvent.click(closeButton!);
    expect(mockOnClose).toBeCalledTimes(1);
  });

  it('should handle click on Cancel button', () => {
    renderComponent(true);

    const cancelButton = screen.queryByRole('button', { name: 'Cancel' });
    expect(cancelButton).toBeTruthy();

    userEvent.click(cancelButton!);
    expect(mockOnClose).toBeCalledTimes(1);
  });

  describe('modal window', () => {
    const isOpen = true;

    test('modal title', () => {
      renderComponent(isOpen);

      expect(
        screen.queryByRole('heading', {
          name: 'Add SSH Keys',
        }),
      ).toBeTruthy();
    });

    test('modal footer', () => {
      renderComponent(isOpen);

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

  describe('should handle saving SSH key', () => {
    const isOpen = true;

    it('should handle valid SSH key', () => {
      renderComponent(isOpen);

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
      expect(mockOnSave).toBeCalledTimes(1);
    });

    it('should handle invalid SSH key', () => {
      renderComponent(isOpen);

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

function getComponent(isOpen: boolean): React.ReactElement {
  return <SshKeysAddModal isOpen={isOpen} onSaveSshKey={mockOnSave} onCloseModal={mockOnClose} />;
}
