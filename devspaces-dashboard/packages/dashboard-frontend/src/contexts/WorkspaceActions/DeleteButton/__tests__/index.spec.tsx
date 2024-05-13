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

import { ActionContextType } from '@/contexts/WorkspaceActions';
import { WorkspaceActionsDeleteButton } from '@/contexts/WorkspaceActions/DeleteButton';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';
import { WorkspaceAction } from '@/services/helpers/types';
import { constructWorkspace } from '@/services/workspace-adapter';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';

const { renderComponent } = getComponentRenderer(getComponent);

const mockHandleAction = jest.fn();
const mockShowConfirmation = jest.fn();
const mockOnAction = jest.fn();

const workspace = constructWorkspace(
  new DevWorkspaceBuilder().withName('my-workspace').withUID('1234').build(),
);

describe('WorkspaceDeleteButton', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('decline confirmation', () => {
    it('should not call the delete action', async () => {
      mockShowConfirmation.mockRejectedValue(undefined);

      renderComponent();

      const deleteButton = screen.getByRole('button', { name: 'Delete Workspace' });
      deleteButton.click();

      await jest.advanceTimersByTimeAsync(1000);

      expect(mockShowConfirmation).toHaveBeenCalledWith([workspace.name]);
      expect(mockHandleAction).not.toHaveBeenCalled();
      expect(mockOnAction).toHaveBeenCalledWith(
        WorkspaceAction.DELETE_WORKSPACE,
        workspace.uid,
        undefined,
      );
    });
  });

  describe('accept confirmation', () => {
    test('delete action succeeded', async () => {
      mockShowConfirmation.mockResolvedValue(undefined);
      mockHandleAction.mockResolvedValue(undefined);

      renderComponent();

      const deleteButton = screen.getByRole('button', { name: 'Delete Workspace' });
      deleteButton.click();

      await jest.advanceTimersByTimeAsync(1000);

      expect(mockShowConfirmation).toHaveBeenCalledWith([workspace.name]);
      expect(mockOnAction).toHaveBeenCalledWith(
        WorkspaceAction.DELETE_WORKSPACE,
        workspace.uid,
        true,
      );
      expect(mockHandleAction).toHaveBeenCalledWith(
        WorkspaceAction.DELETE_WORKSPACE,
        workspace.uid,
      );
    });

    test('delete action failed', async () => {
      mockShowConfirmation.mockResolvedValue(undefined);
      mockHandleAction.mockRejectedValue(new Error('Delete failed'));

      // mute console.warn
      console.warn = jest.fn();

      renderComponent();

      const deleteButton = screen.getByRole('button', { name: 'Delete Workspace' });
      deleteButton.click();

      await jest.advanceTimersByTimeAsync(1000);

      expect(mockShowConfirmation).toHaveBeenCalledWith([workspace.name]);
      expect(mockHandleAction).toHaveBeenCalledWith(
        WorkspaceAction.DELETE_WORKSPACE,
        workspace.uid,
      );
      expect(mockOnAction).toHaveBeenCalledWith(
        WorkspaceAction.DELETE_WORKSPACE,
        workspace.uid,
        false,
      );
    });
  });
});

function getComponent(): React.ReactElement {
  const context: ActionContextType = {
    handleAction: (...args) => mockHandleAction(...args),
    showConfirmation: (...args) => mockShowConfirmation(...args),
    toDelete: [],
  };

  return (
    <WorkspaceActionsDeleteButton context={context} onAction={mockOnAction} workspace={workspace} />
  );
}
