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
import { Action, Store } from 'redux';
import { Provider } from 'react-redux';
import { render, RenderResult, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkspaceActionsProvider from '../Provider';
import { WorkspaceAction } from '../../../services/helpers/types';
import { ActionContextType, WorkspaceActionsConsumer } from '..';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';
import { ActionCreators } from '../../../store/Workspaces';
import { AppThunk } from '../../../store';
import { Workspace } from '../../../services/workspace-adapter';
import { createHashHistory } from 'history';
import { DevWorkspaceBuilder } from '../../../store/__mocks__/devWorkspaceBuilder';

jest.mock('../../../store/Workspaces/index', () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  return {
    actionCreators: {
      deleteWorkspace:
        (workspace: Workspace): AppThunk<Action, Promise<void>> =>
        async (): Promise<void> => {
          return Promise.resolve();
        },
    } as ActionCreators,
  };
  /* eslint-enable @typescript-eslint/no-unused-vars */
});

describe('Workspace Actions', () => {
  const history = createHashHistory();
  const actionButtonName = 'action-button';
  const valueInputId = 'value-input';
  const defaultWorkspaceId = 'workspace-0';
  const nonExistingWorkspaceId = 'non-existing-workspace';

  const mockOnAction = jest.fn((ctx: ActionContextType, action: WorkspaceAction, uid: string) =>
    ctx.handleAction(action, uid),
  );
  const mockOnCancel = jest.fn();

  window.console.warn = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('using without context provider', () => {
    function renderComponent(action: WorkspaceAction): RenderResult {
      const store = createFakeStore();
      return render(
        <Provider store={store}>
          <WorkspaceActionsConsumer>
            {context => (
              <button onClick={() => mockOnAction(context, action, 'workspace-0')}>
                {actionButtonName}
              </button>
            )}
          </WorkspaceActionsConsumer>
        </Provider>,
      );
    }

    it('should drop warning in console', () => {
      renderComponent(WorkspaceAction.ADD_CUSTOM_WORKSPACE);

      const actionButton = screen.getByRole('button');
      userEvent.click(actionButton);

      expect(window.console.warn).toHaveBeenCalledWith(expect.stringContaining('not created yet'));
    });
  });

  describe('using with context provider, handling actions', () => {
    function renderComponent(action: WorkspaceAction, id = defaultWorkspaceId) {
      const store = createFakeStore();
      render(
        <Provider store={store}>
          <WorkspaceActionsProvider history={history}>
            <WorkspaceActionsConsumer>
              {context => (
                <>
                  <button onClick={() => mockOnAction(context, action, id)}>
                    {actionButtonName}
                  </button>
                  <input data-testid={valueInputId} defaultValue={context.toDelete.join(',')} />
                </>
              )}
            </WorkspaceActionsConsumer>
          </WorkspaceActionsProvider>
        </Provider>,
      );
    }

    it('should warn if workspace is not found', () => {
      renderComponent(WorkspaceAction.ADD_CUSTOM_WORKSPACE, nonExistingWorkspaceId);

      const actionButton = screen.getByRole('button');
      userEvent.click(actionButton);

      expect(window.console.warn).toHaveBeenCalledWith(
        expect.stringMatching(/workspace not found/i),
      );
    });

    it('should warn if unhandled action', () => {
      renderComponent(WorkspaceAction.ADD_CUSTOM_WORKSPACE);

      const actionButton = screen.getByRole('button');
      userEvent.click(actionButton);

      expect(window.console.warn).toHaveBeenCalledWith(
        expect.stringMatching(/unhandled action type/i),
      );
    });

    it('should start deleting a workspace', () => {
      renderComponent(WorkspaceAction.DELETE_WORKSPACE);

      const actionButton = screen.getByRole('button');
      userEvent.click(actionButton);

      const valueInput = screen.getByTestId(valueInputId);
      expect(valueInput).toHaveValue('workspace-0');
    });

    it('should warn if workspace is being deleted', () => {
      renderComponent(WorkspaceAction.DELETE_WORKSPACE);

      const actionButton = screen.getByRole('button');
      userEvent.click(actionButton);
      userEvent.click(actionButton);

      expect(window.console.warn).toHaveBeenCalledWith(
        expect.stringMatching(/workspace.+?is being deleted/i),
      );
    });
  });

  describe('using with context provider, confirmation dialog', () => {
    function renderComponent(action: WorkspaceAction, id = defaultWorkspaceId) {
      const store = createFakeStore();
      render(
        <Provider store={store}>
          <WorkspaceActionsProvider history={history}>
            <WorkspaceActionsConsumer>
              {context => (
                <>
                  <button
                    onClick={() =>
                      context
                        .showConfirmation([id])
                        .then(() => mockOnAction(context, action, id))
                        .catch(() => mockOnCancel())
                    }
                  >
                    {actionButtonName}
                  </button>
                  <input data-testid={valueInputId} defaultValue={context.toDelete.join(',')} />
                </>
              )}
            </WorkspaceActionsConsumer>
          </WorkspaceActionsProvider>
        </Provider>,
      );
    }

    it('should correctly render the confirmation window', async () => {
      renderComponent(WorkspaceAction.DELETE_WORKSPACE);

      const actionButton = screen.getByRole('button');
      userEvent.click(actionButton);

      await waitFor(() =>
        expect(
          screen.queryByRole('dialog', { name: /delete workspaces confirmation/i }),
        ).toBeTruthy(),
      );

      const closeButton = screen.queryByRole('button', { name: 'Close' });
      expect(closeButton).toBeTruthy();
      expect(closeButton).toBeEnabled();

      const cancelButton = screen.queryByRole('button', { name: 'Cancel' });
      expect(cancelButton).toBeTruthy();
      expect(cancelButton).toBeEnabled();

      const deleteButton = screen.queryByRole('button', { name: 'Delete' });
      expect(deleteButton).toBeTruthy();
      expect(deleteButton).toBeDisabled();

      const confirmationCheckbox = screen.queryByRole('checkbox', { name: /i understand/i });
      expect(confirmationCheckbox).toBeTruthy();
      expect(confirmationCheckbox).not.toBeChecked();
    });

    it('should handle click on "Close" button', async () => {
      renderComponent(WorkspaceAction.DELETE_WORKSPACE);

      const actionButton = screen.getByRole('button');
      userEvent.click(actionButton);

      await waitFor(() =>
        expect(
          screen.queryByRole('dialog', { name: /delete workspaces confirmation/i }),
        ).toBeTruthy(),
      );

      const closeButton = screen.getByRole('button', { name: 'Close' });
      userEvent.click(closeButton);

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeFalsy());

      expect(mockOnCancel).toBeCalled();
      expect(mockOnAction).not.toBeCalled();
    });

    it('should handle click on "Cancel" button', async () => {
      renderComponent(WorkspaceAction.DELETE_WORKSPACE);

      const actionButton = screen.getByRole('button');
      userEvent.click(actionButton);

      await waitFor(() =>
        expect(
          screen.queryByRole('dialog', { name: /delete workspaces confirmation/i }),
        ).toBeTruthy(),
      );

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      userEvent.click(cancelButton);

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeFalsy());

      expect(mockOnCancel).toBeCalled();
      expect(mockOnAction).not.toBeCalled();
    });

    it('should handle click on "Delete" button', async () => {
      renderComponent(WorkspaceAction.DELETE_WORKSPACE);

      const actionButton = screen.getByRole('button');
      userEvent.click(actionButton);

      await waitFor(() =>
        expect(
          screen.queryByRole('dialog', { name: /delete workspaces confirmation/i }),
        ).toBeTruthy(),
      );

      const confirmationCheckbox = screen.getByRole('checkbox', { name: /i understand/i });
      userEvent.click(confirmationCheckbox);

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      expect(deleteButton).toBeEnabled();
      userEvent.click(deleteButton);

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeFalsy());

      expect(mockOnCancel).not.toBeCalled();
      expect(mockOnAction).toBeCalled();
    });
  });
});

function createFakeStore(): Store {
  const workspaces = [0, 1, 2, 3, 4].map(i =>
    new DevWorkspaceBuilder()
      .withUID('workspace-' + i)
      .withName('workspace-' + i)
      .build(),
  );
  return new FakeStoreBuilder()
    .withDevWorkspaces({
      workspaces,
    })
    .build();
}
