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

import { StateMock } from '@react-mock/state';
import userEvent, { UserEvent } from '@testing-library/user-event';
import React from 'react';

import { ActionContextType } from '@/contexts/WorkspaceActions';
import { State, WorkspaceActionsDropdown } from '@/contexts/WorkspaceActions/Dropdown';
import { container } from '@/inversify.config';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';
import { AppAlerts } from '@/services/alerts/appAlerts';
import { AlertItem, DevWorkspaceStatus, WorkspaceAction } from '@/services/helpers/types';
import { Workspace } from '@/services/workspace-adapter';

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockHandleAction = jest.fn();
const mockShowConfirmation = jest.fn();
const mockOnAction = jest.fn();

describe('WorkspaceActionsDropdown', () => {
  let workspace: Workspace;
  let user: UserEvent;

  beforeEach(() => {
    workspace = {
      status: DevWorkspaceStatus.STOPPED,
      uid: '1234',
      name: 'my-workspace',
    } as Workspace;

    jest.useFakeTimers();

    user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();

    mockHandleAction.mockReset();
  });

  describe('kebab toggle', () => {
    test('snapshot', () => {
      const snapshot = createSnapshot(workspace, 'kebab-toggle');
      expect(snapshot.toJSON()).toMatchSnapshot();
    });

    test('open dropdown', async () => {
      renderComponent(workspace, 'kebab-toggle');

      const toggle = screen.queryByRole('button', { name: 'Actions' });

      expect(toggle).toBeTruthy();
      expect(toggle).toHaveAttribute('data-testtype', 'kebab-toggle');

      // dropdown menu is not visible
      expect(screen.queryByRole('menu', { name: 'Actions' })).toBeNull();

      // toggle dropdown
      const kebabToggle = toggle!;
      await user.click(kebabToggle);

      // now the dropdown menu is visible
      expect(screen.queryByRole('menu', { name: 'Actions' })).not.toBeNull();
    });
  });

  describe('dropdown toggle', () => {
    test('snapshot', () => {
      const snapshot = createSnapshot(workspace, 'dropdown-toggle');
      expect(snapshot.toJSON()).toMatchSnapshot();
    });

    test('open dropdown', async () => {
      renderComponent(workspace, 'dropdown-toggle');

      const toggle = screen.queryByRole('button', { name: 'Actions' });

      expect(toggle).not.toBeNull();
      expect(toggle).toHaveAttribute('data-testtype', 'dropdown-toggle');

      // dropdown menu is not visible
      expect(screen.queryByRole('menu', { name: 'Actions' })).toBeNull();

      // toggle dropdown
      const dropdownToggle = toggle!;
      await user.click(dropdownToggle);

      // now the dropdown menu is visible
      expect(screen.queryByRole('menu', { name: 'Actions' })).not.toBeNull();
    });
  });

  describe('actions handling', () => {
    test('action: open', async () => {
      mockHandleAction.mockResolvedValueOnce(undefined);

      renderComponent(workspace, 'kebab-toggle', { isExpanded: true });

      const actionOpen = screen.queryByRole('menuitem', { name: 'Action: Open' });

      expect(actionOpen).not.toBeNull();

      await user.click(actionOpen!);

      await jest.advanceTimersByTimeAsync(1000);

      expect(mockShowConfirmation).not.toHaveBeenCalled();
      expect(mockHandleAction).toHaveBeenCalledWith(WorkspaceAction.OPEN_IDE, workspace.uid);
      expect(mockOnAction).toHaveBeenCalledWith(
        WorkspaceAction.OPEN_IDE,
        workspace.uid,
        true, // succeeded
      );
    });

    test('action: open in debug mode', async () => {
      mockHandleAction.mockResolvedValueOnce(undefined);

      renderComponent(workspace, 'kebab-toggle', { isExpanded: true });

      const actionOpenInDebugMode = screen.queryByRole('menuitem', {
        name: 'Action: Open in Debug mode',
      });

      expect(actionOpenInDebugMode).not.toBeNull();

      await user.click(actionOpenInDebugMode!);

      await jest.advanceTimersByTimeAsync(1000);

      expect(mockShowConfirmation).not.toHaveBeenCalled();
      expect(mockHandleAction).toHaveBeenCalledWith(
        WorkspaceAction.START_DEBUG_AND_OPEN_LOGS,
        workspace.uid,
      );
      expect(mockOnAction).toHaveBeenCalledWith(
        WorkspaceAction.START_DEBUG_AND_OPEN_LOGS,
        workspace.uid,
        true, // succeeded
      );
    });

    test('action: start in background', async () => {
      mockHandleAction.mockResolvedValueOnce(undefined);

      renderComponent(workspace, 'kebab-toggle', { isExpanded: true });

      const actionOpenInBackground = screen.getByRole('menuitem', {
        name: 'Action: Start in background',
      });

      expect(actionOpenInBackground).not.toBeNull();

      await user.click(actionOpenInBackground!);

      await jest.advanceTimersByTimeAsync(1000);

      expect(mockShowConfirmation).not.toHaveBeenCalled();
      expect(mockHandleAction).toHaveBeenCalledWith(
        WorkspaceAction.START_IN_BACKGROUND,
        workspace.uid,
      );
      expect(mockOnAction).toHaveBeenCalledWith(
        WorkspaceAction.START_IN_BACKGROUND,
        workspace.uid,
        true, // succeeded
      );
    });

    test('action: restart workspace', async () => {
      mockHandleAction.mockResolvedValueOnce(undefined);

      workspace.status = DevWorkspaceStatus.RUNNING;
      renderComponent(workspace, 'kebab-toggle', { isExpanded: true });

      const actionRestartWorkspace = screen.getByRole('menuitem', {
        name: 'Action: Restart Workspace',
      });

      expect(actionRestartWorkspace).not.toBeNull();

      await user.click(actionRestartWorkspace!);

      await jest.advanceTimersByTimeAsync(1000);

      expect(mockShowConfirmation).not.toHaveBeenCalled();
      expect(mockHandleAction).toHaveBeenCalledWith(
        WorkspaceAction.RESTART_WORKSPACE,
        workspace.uid,
      );
      expect(mockOnAction).toHaveBeenCalledWith(
        WorkspaceAction.RESTART_WORKSPACE,
        workspace.uid,
        true, // succeeded
      );
    });

    test('action: stop workspace', async () => {
      mockHandleAction.mockResolvedValueOnce(undefined);

      workspace.status = DevWorkspaceStatus.RUNNING;
      renderComponent(workspace, 'kebab-toggle', { isExpanded: true });

      const actionStopWorkspace = screen.getByRole('menuitem', {
        name: 'Action: Stop Workspace',
      });

      expect(actionStopWorkspace).not.toBeNull();

      await user.click(actionStopWorkspace!);

      await jest.advanceTimersByTimeAsync(1000);

      expect(mockShowConfirmation).not.toHaveBeenCalled();
      expect(mockHandleAction).toHaveBeenCalledWith(WorkspaceAction.STOP_WORKSPACE, workspace.uid);
      expect(mockOnAction).toHaveBeenCalledWith(
        WorkspaceAction.STOP_WORKSPACE,
        workspace.uid,
        true, // succeeded
      );
    });

    describe('action: delete workspace', () => {
      test('confirmation declined', async () => {
        mockHandleAction.mockResolvedValueOnce(undefined);

        // confirmation declined
        mockShowConfirmation.mockRejectedValueOnce(undefined);

        workspace.status = DevWorkspaceStatus.STOPPED;
        renderComponent(workspace, 'kebab-toggle', { isExpanded: true });

        const actionDeleteWorkspace = screen.getByRole('menuitem', {
          name: 'Action: Delete Workspace',
        });

        expect(actionDeleteWorkspace).not.toBeNull();

        await user.click(actionDeleteWorkspace!);

        await jest.advanceTimersByTimeAsync(1000);

        expect(mockShowConfirmation).toHaveBeenCalledTimes(1);
        expect(mockHandleAction).not.toHaveBeenCalled();
        expect(mockOnAction).toHaveBeenCalledWith(
          WorkspaceAction.DELETE_WORKSPACE,
          workspace.uid,
          undefined, // declined
        );
      });

      test('confirmation accepted, deletion succeeded', async () => {
        mockHandleAction.mockResolvedValueOnce(undefined);

        // confirmation accepted
        mockShowConfirmation.mockResolvedValueOnce(undefined);

        workspace.status = DevWorkspaceStatus.STOPPED;
        renderComponent(workspace, 'kebab-toggle', { isExpanded: true });

        const actionDeleteWorkspace = screen.getByRole('menuitem', {
          name: 'Action: Delete Workspace',
        });

        expect(actionDeleteWorkspace).not.toBeNull();

        await user.click(actionDeleteWorkspace!);

        await jest.advanceTimersByTimeAsync(1000);

        expect(mockShowConfirmation).toHaveBeenCalled();
        expect(mockHandleAction).toHaveBeenCalledWith(
          WorkspaceAction.DELETE_WORKSPACE,
          workspace.uid,
        );
        expect(mockOnAction).toHaveBeenCalledWith(
          WorkspaceAction.DELETE_WORKSPACE,
          workspace.uid,
          true, // succeeded
        );
      });

      test('confirmation accepted, deletion failed', async () => {
        // mute console.error
        console.error = jest.fn();

        mockHandleAction.mockRejectedValueOnce(undefined);

        // confirmation accepted
        mockShowConfirmation.mockResolvedValueOnce(undefined);

        workspace.status = DevWorkspaceStatus.STOPPED;
        renderComponent(workspace, 'kebab-toggle', { isExpanded: true });

        const actionDeleteWorkspace = screen.getByRole('menuitem', {
          name: 'Action: Delete Workspace',
        });

        expect(actionDeleteWorkspace).not.toBeNull();

        await user.click(actionDeleteWorkspace!);

        await jest.advanceTimersByTimeAsync(1000);

        expect(mockShowConfirmation).toHaveBeenCalled();
        expect(mockHandleAction).toHaveBeenCalledWith(
          WorkspaceAction.DELETE_WORKSPACE,
          workspace.uid,
        );
        expect(mockOnAction).toHaveBeenCalledWith(
          WorkspaceAction.DELETE_WORKSPACE,
          workspace.uid,
          false, // failed
        );
      });
    });
  });

  describe('actions status', () => {
    test('workspace FAILED', () => {
      workspace.status = DevWorkspaceStatus.FAILED;
      renderComponent(workspace, 'kebab-toggle', { isExpanded: true });

      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.OPEN_IDE }),
      ).toHaveAttribute('aria-disabled', 'false');
      expect(
        screen.getByRole('menuitem', {
          name: 'Action: ' + WorkspaceAction.START_DEBUG_AND_OPEN_LOGS,
        }),
      ).toHaveAttribute('aria-disabled', 'false');
      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.START_IN_BACKGROUND }),
      ).toHaveAttribute('aria-disabled', 'false');
      expect(
        screen.getByRole('menuitem', {
          name: 'Action: ' + WorkspaceAction.RESTART_WORKSPACE,
        }),
      ).toHaveAttribute('aria-disabled', 'true');
      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.STOP_WORKSPACE }),
      ).toHaveAttribute('aria-disabled', 'true');
      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.DELETE_WORKSPACE }),
      ).toHaveAttribute('aria-disabled', 'false');
    });

    test('workspace FAILING', () => {
      workspace.status = DevWorkspaceStatus.FAILING;
      renderComponent(workspace, 'kebab-toggle', { isExpanded: true });

      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.OPEN_IDE }),
      ).toHaveAttribute('aria-disabled', 'false');
      expect(
        screen.getByRole('menuitem', {
          name: 'Action: ' + WorkspaceAction.START_DEBUG_AND_OPEN_LOGS,
        }),
      ).toHaveAttribute('aria-disabled', 'true');
      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.START_IN_BACKGROUND }),
      ).toHaveAttribute('aria-disabled', 'true');
      expect(
        screen.getByRole('menuitem', {
          name: 'Action: ' + WorkspaceAction.RESTART_WORKSPACE,
        }),
      ).toHaveAttribute('aria-disabled', 'false');
      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.STOP_WORKSPACE }),
      ).toHaveAttribute('aria-disabled', 'false');
      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.DELETE_WORKSPACE }),
      ).toHaveAttribute('aria-disabled', 'false');
    });

    test('workspace RUNNING', () => {
      workspace.status = DevWorkspaceStatus.RUNNING;
      renderComponent(workspace, 'kebab-toggle', { isExpanded: true });

      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.OPEN_IDE }),
      ).toHaveAttribute('aria-disabled', 'false');
      expect(
        screen.getByRole('menuitem', {
          name: 'Action: ' + WorkspaceAction.START_DEBUG_AND_OPEN_LOGS,
        }),
      ).toHaveAttribute('aria-disabled', 'true');
      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.START_IN_BACKGROUND }),
      ).toHaveAttribute('aria-disabled', 'true');
      expect(
        screen.getByRole('menuitem', {
          name: 'Action: ' + WorkspaceAction.RESTART_WORKSPACE,
        }),
      ).toHaveAttribute('aria-disabled', 'false');
      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.STOP_WORKSPACE }),
      ).toHaveAttribute('aria-disabled', 'false');
      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.DELETE_WORKSPACE }),
      ).toHaveAttribute('aria-disabled', 'false');
    });

    test('workspace STARTING', () => {
      workspace.status = DevWorkspaceStatus.STARTING;
      renderComponent(workspace, 'kebab-toggle', { isExpanded: true });

      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.OPEN_IDE }),
      ).toHaveAttribute('aria-disabled', 'false');
      expect(
        screen.getByRole('menuitem', {
          name: 'Action: ' + WorkspaceAction.START_DEBUG_AND_OPEN_LOGS,
        }),
      ).toHaveAttribute('aria-disabled', 'true');
      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.START_IN_BACKGROUND }),
      ).toHaveAttribute('aria-disabled', 'true');
      expect(
        screen.getByRole('menuitem', {
          name: 'Action: ' + WorkspaceAction.RESTART_WORKSPACE,
        }),
      ).toHaveAttribute('aria-disabled', 'false');
      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.STOP_WORKSPACE }),
      ).toHaveAttribute('aria-disabled', 'false');
      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.DELETE_WORKSPACE }),
      ).toHaveAttribute('aria-disabled', 'false');
    });

    test('workspace STOPPED', () => {
      workspace.status = DevWorkspaceStatus.STOPPED;
      renderComponent(workspace, 'kebab-toggle', { isExpanded: true });

      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.OPEN_IDE }),
      ).toHaveAttribute('aria-disabled', 'false');
      expect(
        screen.getByRole('menuitem', {
          name: 'Action: ' + WorkspaceAction.START_DEBUG_AND_OPEN_LOGS,
        }),
      ).toHaveAttribute('aria-disabled', 'false');
      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.START_IN_BACKGROUND }),
      ).toHaveAttribute('aria-disabled', 'false');
      expect(
        screen.getByRole('menuitem', {
          name: 'Action: ' + WorkspaceAction.RESTART_WORKSPACE,
        }),
      ).toHaveAttribute('aria-disabled', 'true');
      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.STOP_WORKSPACE }),
      ).toHaveAttribute('aria-disabled', 'true');
      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.DELETE_WORKSPACE }),
      ).toHaveAttribute('aria-disabled', 'false');
    });

    test('workspace STOPPING', () => {
      workspace.status = DevWorkspaceStatus.STOPPING;
      renderComponent(workspace, 'kebab-toggle', { isExpanded: true });

      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.OPEN_IDE }),
      ).toHaveAttribute('aria-disabled', 'false');
      expect(
        screen.getByRole('menuitem', {
          name: 'Action: ' + WorkspaceAction.START_DEBUG_AND_OPEN_LOGS,
        }),
      ).toHaveAttribute('aria-disabled', 'true');
      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.START_IN_BACKGROUND }),
      ).toHaveAttribute('aria-disabled', 'true');
      expect(
        screen.getByRole('menuitem', {
          name: 'Action: ' + WorkspaceAction.RESTART_WORKSPACE,
        }),
      ).toHaveAttribute('aria-disabled', 'false');
      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.STOP_WORKSPACE }),
      ).toHaveAttribute('aria-disabled', 'false');
      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.DELETE_WORKSPACE }),
      ).toHaveAttribute('aria-disabled', 'false');
    });

    test('workspace TERMINATING', () => {
      workspace.status = DevWorkspaceStatus.TERMINATING;
      renderComponent(workspace, 'kebab-toggle', { isExpanded: true });

      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.OPEN_IDE }),
      ).toHaveAttribute('aria-disabled', 'true');
      expect(
        screen.getByRole('menuitem', {
          name: 'Action: ' + WorkspaceAction.START_DEBUG_AND_OPEN_LOGS,
        }),
      ).toHaveAttribute('aria-disabled', 'true');
      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.START_IN_BACKGROUND }),
      ).toHaveAttribute('aria-disabled', 'true');
      expect(
        screen.getByRole('menuitem', {
          name: 'Action: ' + WorkspaceAction.RESTART_WORKSPACE,
        }),
      ).toHaveAttribute('aria-disabled', 'true');
      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.STOP_WORKSPACE }),
      ).toHaveAttribute('aria-disabled', 'true');
      expect(
        screen.getByRole('menuitem', { name: 'Action: ' + WorkspaceAction.DELETE_WORKSPACE }),
      ).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('alerts', () => {
    const mockShowAlert = jest.fn();

    beforeEach(() => {
      class MockAppAlerts extends AppAlerts {
        showAlert(alert: AlertItem): void {
          mockShowAlert(alert);
        }
      }

      container.snapshot();
      container.rebind(AppAlerts).to(MockAppAlerts).inSingletonScope();
    });

    afterEach(() => {
      container.restore();
    });

    test('deletion failed', async () => {
      // mute console.error
      console.error = jest.fn();

      // reject promise - deletion failed
      const errorMessage = 'delete failed';
      mockHandleAction.mockReset();
      mockHandleAction.mockRejectedValueOnce(new Error(errorMessage));

      // confirmation accepted
      mockShowConfirmation.mockResolvedValueOnce(undefined);

      workspace.status = DevWorkspaceStatus.STOPPED;
      renderComponent(workspace, 'kebab-toggle', { isExpanded: true });

      const actionDeleteWorkspace = screen.getByRole('menuitem', {
        name: 'Action: Delete Workspace',
      });

      expect(actionDeleteWorkspace).not.toBeNull();

      await user.click(actionDeleteWorkspace!);

      await jest.advanceTimersByTimeAsync(1000);

      expect(mockShowConfirmation).toHaveBeenCalled();
      expect(mockHandleAction).toHaveBeenCalled();
      expect(mockOnAction).toHaveBeenCalledWith(
        WorkspaceAction.DELETE_WORKSPACE,
        workspace.uid,
        false, // failed
      );

      expect(mockShowAlert).toHaveBeenCalledWith({
        key: expect.stringContaining('workspace-dropdown-action'),
        title: `Unable to delete workspace ${workspace.name}. ${errorMessage}`,
        variant: 'warning',
      });
    });
  });
});

function getComponent(
  workspace: Workspace,
  toggle: 'kebab-toggle' | 'dropdown-toggle',
  localState?: Partial<State>,
): React.ReactElement {
  const context: ActionContextType = {
    handleAction: (...args) => mockHandleAction(...args),
    showConfirmation: (...args) => mockShowConfirmation(...args),
    toDelete: [],
  };

  const component = (
    <WorkspaceActionsDropdown
      context={context}
      onAction={mockOnAction}
      workspace={workspace}
      toggle={toggle}
    />
  );

  if (localState) {
    return <StateMock state={localState}>{component}</StateMock>;
  }

  return component;
}
