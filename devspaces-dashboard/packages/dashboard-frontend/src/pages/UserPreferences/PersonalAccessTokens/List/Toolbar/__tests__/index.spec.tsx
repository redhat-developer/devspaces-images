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

import React from 'react';

import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

import { PersonalAccessTokenListToolbar } from '..';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnAdd = jest.fn();
const mockOnDelete = jest.fn();

describe('PersonalAccessTokenListToolbar', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot when no items selected', () => {
    const snapshot = createSnapshot([]);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('snapshot when some items selected', () => {
    const snapshot = createSnapshot([undefined, undefined]);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  describe('add token button', () => {
    it('should be disabled when isDisabled is true', () => {
      renderComponent([undefined, undefined], true);

      const button = screen.getByRole('button', { name: 'Add Token' });

      expect(button).toBeDisabled();
    });

    it('should handle onAdd event', () => {
      renderComponent([undefined, undefined]);

      expect(mockOnAdd).not.toHaveBeenCalled();

      const button = screen.getByRole('button', { name: 'Add Token' });
      button.click();

      expect(mockOnAdd).toHaveBeenCalled();
    });
  });

  describe('delete button', () => {
    it('should be disabled when isDisabled is true', () => {
      renderComponent([undefined, undefined], true);

      const button = screen.getByRole('button', { name: 'Delete' });

      expect(button).toBeDisabled();
    });

    it('should be disabled when no items are selected', () => {
      renderComponent([]);

      const button = screen.getByRole('button', { name: 'Delete' });

      expect(button).toBeDisabled();
    });

    it('should handle onDelete event', () => {
      renderComponent([undefined, undefined]);

      expect(mockOnDelete).not.toHaveBeenCalled();

      const button = screen.getByRole('button', { name: 'Delete' });
      button.click();

      expect(mockOnDelete).toHaveBeenCalled();
    });
  });
});

function getComponent(selectedItems: unknown[], isDisabled = false): React.ReactElement {
  return (
    <PersonalAccessTokenListToolbar
      isDisabled={isDisabled}
      selectedItems={selectedItems}
      onAdd={mockOnAdd}
      onDelete={mockOnDelete}
    />
  );
}
