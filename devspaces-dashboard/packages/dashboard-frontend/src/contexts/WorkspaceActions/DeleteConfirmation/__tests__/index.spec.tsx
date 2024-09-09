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

import userEvent from '@testing-library/user-event';
import React from 'react';

import { WantDelete } from '@/contexts/WorkspaceActions';
import { WorkspaceActionsDeleteConfirmation } from '@/contexts/WorkspaceActions/DeleteConfirmation';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

const { renderComponent } = getComponentRenderer(getComponent);

const mockOnClose = jest.fn();
const mockOnConfirm = jest.fn();

describe('WorkspaceActionsDeleteConfirmation', () => {
  const oneWorkspace: WantDelete = ['workspace1'];
  const twoWorkspaces: WantDelete = ['workspace1', 'workspace2'];

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('modal is hidden', () => {
    renderComponent(false, oneWorkspace);

    expect(screen.queryByRole('dialog')).toBeFalsy();
  });

  describe('modal is visible', () => {
    test('one workspace text', () => {
      renderComponent(true, oneWorkspace);

      const dialog = screen.queryByRole('dialog');

      expect(dialog).toBeTruthy();
      expect(dialog).toHaveTextContent(`Would you like to delete workspace "${oneWorkspace[0]}"?`);
    });

    test('two workspaces text', () => {
      renderComponent(true, twoWorkspaces);

      const dialog = screen.queryByRole('dialog');

      expect(dialog).toBeTruthy();
      expect(dialog).toHaveTextContent(
        `Would you like to delete ${twoWorkspaces.length} workspaces?`,
      );
    });
  });

  test('click on Close button', async () => {
    renderComponent(true, oneWorkspace);

    const closeButton = screen.queryByRole('button', { name: /close/i });

    expect(closeButton).toBeTruthy();

    await userEvent.click(closeButton!);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('click on Cancel button', async () => {
    renderComponent(true, oneWorkspace);

    const cancelButton = screen.queryByRole('button', { name: /cancel/i });

    expect(cancelButton).toBeTruthy();

    await userEvent.click(cancelButton!);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('click on Confirm button', async () => {
    renderComponent(true, oneWorkspace);

    const checkbox = screen.queryByRole('checkbox', {
      name: /i understand, this operation cannot be reverted./i,
    });
    expect(checkbox).toBeTruthy();

    const confirmButton = screen.queryByRole('button', { name: 'Delete' });
    expect(confirmButton).toBeTruthy();

    // initially the Delete button is disabled
    expect(confirmButton).toBeDisabled();

    // enable the Delete button
    await userEvent.click(checkbox!);
    expect(confirmButton).toBeEnabled();

    await userEvent.click(confirmButton!);
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });
});

function getComponent(isOpen: boolean, wantDelete: [string, ...string[]]): React.ReactElement {
  return (
    <WorkspaceActionsDeleteConfirmation
      isOpen={isOpen}
      wantDelete={wantDelete}
      onClose={mockOnClose}
      onConfirm={mockOnConfirm}
    />
  );
}
