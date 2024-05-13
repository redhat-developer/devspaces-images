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
import { WorkspaceActionsBulkDeleteButton } from '@/contexts/WorkspaceActions/BulkDeleteButton';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';
import { WorkspaceAction } from '@/services/helpers/types';
import { constructWorkspace, Workspace } from '@/services/workspace-adapter';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';

const { renderComponent } = getComponentRenderer(getComponent);

const mockHandleAction = jest.fn();
const mockShowConfirmation = jest.fn();
const mockOnAction = jest.fn();

const workspaces: Workspace[] = [
  constructWorkspace(
    new DevWorkspaceBuilder()
      .withName('workspace1')
      .withUID('1234')
      .withStatus({ phase: 'RUNNING' })
      .build(),
  ),
  constructWorkspace(
    new DevWorkspaceBuilder()
      .withName('workspace2')
      .withUID('5678')
      .withStatus({ phase: 'STARTING' })
      .build(),
  ),
];

describe('WorkspaceActionsBulkDeleteButton', () => {
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

      const deleteButton = screen.getByRole('button', { name: 'Delete Selected Workspaces' });
      deleteButton.click();

      await jest.advanceTimersByTimeAsync(1000);

      expect(mockShowConfirmation).toHaveBeenCalledWith([workspaces[0].name, workspaces[1].name]);
      expect(mockHandleAction).not.toHaveBeenCalled();

      expect(mockOnAction).toHaveBeenCalledTimes(2);
      expect(mockOnAction).toHaveBeenNthCalledWith(
        1,
        WorkspaceAction.DELETE_WORKSPACE,
        workspaces[0].uid,
        undefined, // deletion was not confirmed
      );
      expect(mockOnAction).toHaveBeenNthCalledWith(
        2,
        WorkspaceAction.DELETE_WORKSPACE,
        workspaces[1].uid,
        undefined, // deletion was not confirmed
      );
    });
  });

  describe('accept confirmation', () => {
    test('delete action succeeded', async () => {
      mockShowConfirmation.mockResolvedValue(undefined);
      mockHandleAction.mockResolvedValue(undefined);

      renderComponent();

      const deleteButton = screen.getByRole('button', { name: 'Delete Selected Workspaces' });
      deleteButton.click();

      await jest.advanceTimersByTimeAsync(1000);

      expect(mockShowConfirmation).toHaveBeenCalledWith([workspaces[0].name, workspaces[1].name]);

      expect(mockOnAction).toHaveBeenCalledTimes(2);
      expect(mockOnAction).toHaveBeenNthCalledWith(
        1,
        WorkspaceAction.DELETE_WORKSPACE,
        workspaces[0].uid,
        true, // deletion was confirmed and succeeded
      );
      expect(mockOnAction).toHaveBeenNthCalledWith(
        2,
        WorkspaceAction.DELETE_WORKSPACE,
        workspaces[1].uid,
        true, // deletion was confirmed and succeeded
      );

      expect(mockHandleAction).toHaveBeenCalledTimes(2);
      expect(mockHandleAction).toHaveBeenNthCalledWith(
        1,
        WorkspaceAction.DELETE_WORKSPACE,
        workspaces[0].uid,
      );
      expect(mockHandleAction).toHaveBeenNthCalledWith(
        2,
        WorkspaceAction.DELETE_WORKSPACE,
        workspaces[1].uid,
      );
    });

    test('delete action failed', async () => {
      mockShowConfirmation.mockResolvedValue(undefined);
      mockHandleAction.mockRejectedValue(new Error('Delete failed'));

      // mute console.warn
      console.warn = jest.fn();

      renderComponent();

      const deleteButton = screen.getByRole('button', { name: 'Delete Selected Workspaces' });
      deleteButton.click();

      await jest.advanceTimersByTimeAsync(1000);

      expect(mockShowConfirmation).toHaveBeenCalledWith([workspaces[0].name, workspaces[1].name]);

      expect(mockOnAction).toHaveBeenCalledTimes(2);
      expect(mockOnAction).toHaveBeenNthCalledWith(
        1,
        WorkspaceAction.DELETE_WORKSPACE,
        workspaces[0].uid,
        false, // deletion was confirmed and failed
      );
      expect(mockOnAction).toHaveBeenNthCalledWith(
        2,
        WorkspaceAction.DELETE_WORKSPACE,
        workspaces[1].uid,
        false, // deletion was confirmed and failed
      );

      expect(mockHandleAction).toHaveBeenCalledTimes(2);
      expect(mockHandleAction).toHaveBeenNthCalledWith(
        1,
        WorkspaceAction.DELETE_WORKSPACE,
        workspaces[0].uid,
      );
      expect(mockHandleAction).toHaveBeenNthCalledWith(
        2,
        WorkspaceAction.DELETE_WORKSPACE,
        workspaces[1].uid,
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
    <WorkspaceActionsBulkDeleteButton
      context={context}
      isDisabled={false}
      onAction={mockOnAction}
      workspaces={workspaces}
    />
  );
}
