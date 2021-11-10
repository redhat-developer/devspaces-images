/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
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

import React from 'react';
import { createHashHistory } from 'history';
import { render, screen, RenderResult, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkspacesList from '..';
import { BrandingData } from '../../../services/bootstrap/branding.constant';
import { createFakeCheWorkspace } from '../../../store/__mocks__/workspace';
import { WorkspaceAction, WorkspaceStatus } from '../../../services/helpers/types';
import { convertWorkspace, Workspace } from '../../../services/workspace-adapter';

jest.mock('../../../components/Head', () => {
  const FakeHead = () => {
    return <span>Dummy Head Component</span>;
  };
  FakeHead.displayName = 'fake-Head';
  return FakeHead;
});

jest.mock('react-tooltip', () => {
  return function DummyTooltip(): React.ReactElement {
    return <div>Dummy Tooltip</div>;
  };
});

// mute the outputs
console.log = jest.fn();

const brandingData = {
  docs: {
    workspace: 'workspaces/documentation/link',
  },
} as BrandingData;

let workspaces: Workspace[];
let isDeleted: string[];

let mockOnAction = jest.fn().mockResolvedValue(undefined);
let mockShowConfirmation = jest.fn().mockResolvedValue(undefined);

describe('Workspaces List Page', () => {
  beforeEach(() => {
    workspaces = [0, 1, 2, 3, 4]
      .map(i => createFakeCheWorkspace('workspace-' + i, 'workspace-' + i))
      .map(workspace => convertWorkspace(workspace));
    isDeleted = [];
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render correctly', () => {
    renderComponent();

    const table = screen.queryByRole('grid');
    expect(table).toBeTruthy();

    const rows = screen.queryAllByRole('row');
    // expect number of workspaces plus header row
    expect(rows.length).toEqual(workspaces.length + 1);

    /* Toolbar controls */

    const selectAllCheckbox = screen.queryByRole('checkbox', { name: /select all workspaces/i });
    expect(selectAllCheckbox).toBeTruthy();
    expect(selectAllCheckbox).not.toBeChecked();

    expect(screen.queryByRole('searchbox')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /filter workspaces/i })).toBeTruthy();

    const deleteSelectedButton = screen.queryByRole('button', {
      name: /delete selected workspaces/i,
    });
    expect(deleteSelectedButton).toBeTruthy();
    expect(deleteSelectedButton).toBeDisabled();
  });

  describe('Toolbar', () => {
    describe('Select All Checkbox', () => {
      it('should select all rows', () => {
        renderComponent();

        const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all workspaces/i });
        const rowCheckboxes = screen.getAllByRole('checkbox', { name: /select row/i });

        rowCheckboxes.forEach(checkbox => {
          expect(checkbox).not.toBeChecked();
        });

        // select all workspaces
        userEvent.click(selectAllCheckbox);

        rowCheckboxes.forEach(checkbox => {
          expect(checkbox).toBeChecked();
        });

        // deselect all workspaces
        userEvent.click(selectAllCheckbox);

        rowCheckboxes.forEach(checkbox => {
          expect(checkbox).not.toBeChecked();
        });
      });
    });

    describe('Workspaces Filter', () => {
      it('should filter rows', () => {
        renderComponent();

        const searchbox = screen.getByRole('searchbox');
        const searchButton = screen.getByRole('button', { name: /filter workspaces/i });

        const rows = screen.getAllByRole('row');
        // including the header row
        expect(rows.length).toEqual(workspaces.length + 1);

        userEvent.type(searchbox, workspaces[0].devfile.metadata.name!);
        userEvent.click(searchButton);

        const rowsFiltered = screen.getAllByRole('row');
        // including the header row
        expect(rowsFiltered.length).toEqual(2);
      });
    });

    describe('Bulk Delete Button', () => {
      it('should emit event if confirmed', async () => {
        renderComponent();

        const deleteSelectedButton = screen.getByRole('button', {
          name: /delete selected workspaces/i,
        });

        const checkboxes = screen.getAllByRole('checkbox', { name: /select row/i });

        userEvent.click(checkboxes[0]);
        userEvent.click(checkboxes[1]);
        userEvent.click(checkboxes[2]);

        expect(deleteSelectedButton).toBeEnabled();
        userEvent.click(deleteSelectedButton);

        await waitFor(() => expect(mockOnAction).toHaveBeenCalledTimes(3));

        expect(mockOnAction).toHaveBeenCalledWith(
          WorkspaceAction.DELETE_WORKSPACE,
          workspaces[0].id,
        );
        expect(mockOnAction).toHaveBeenCalledWith(
          WorkspaceAction.DELETE_WORKSPACE,
          workspaces[1].id,
        );
        expect(mockOnAction).toHaveBeenCalledWith(
          WorkspaceAction.DELETE_WORKSPACE,
          workspaces[2].id,
        );
      });

      it('should not emit event if not confirmed', async () => {
        mockShowConfirmation = jest.fn().mockRejectedValue(undefined);
        renderComponent();

        const deleteSelectedButton = screen.getByRole('button', {
          name: /delete selected workspaces/i,
        });

        const checkboxes = screen.getAllByRole('checkbox', { name: /select row/i });

        userEvent.click(checkboxes[0]);
        userEvent.click(checkboxes[1]);
        userEvent.click(checkboxes[2]);

        expect(deleteSelectedButton).toBeEnabled();
        userEvent.click(deleteSelectedButton);

        await waitFor(() => expect(mockOnAction).not.toHaveBeenCalled());
      });
    });

    it('should bulk delete visible workspaces only', async () => {
      renderComponent();

      const searchbox = screen.getByRole('searchbox');
      const searchButton = screen.getByRole('button', { name: /filter workspaces/i });

      userEvent.type(searchbox, workspaces[0].devfile.metadata.name!);
      userEvent.click(searchButton);

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
      userEvent.click(selectAllCheckbox);

      const bulkDeleteButton = screen.getByRole('button', { name: /delete selected workspaces/i });
      userEvent.click(bulkDeleteButton);

      await waitFor(() => expect(mockOnAction).toHaveBeenCalledTimes(1));
      expect(mockOnAction).toHaveBeenCalledWith(
        WorkspaceAction.DELETE_WORKSPACE,
        workspaces[0].devfile.metadata.name,
      );
    });

    it('should expose correct number of workspaces to delete https://github.com/eclipse/che/issues/19057', async () => {
      let wantToDelete: string[] = [];
      mockOnAction = jest.fn().mockImplementation((action: string, workspaceName: string) => {
        workspaces = workspaces.filter(
          workspace => workspace.devfile.metadata.name !== workspaceName,
        );
        wantToDelete = workspaces.map(workspace => workspace.devfile.metadata.name!);
        return Promise.resolve();
      });
      const { rerender } = renderComponent();

      /* delete one workspace */

      const actionButtons = screen.getAllByRole('button', { name: /actions/i });
      // click the kebab button on the first workspace row
      userEvent.click(actionButtons[0]);

      const deleteAction = screen.getByRole('button', { name: /delete workspace/i });
      userEvent.click(deleteAction);

      // wait for the workspace is deleted
      await waitFor(() => expect(mockOnAction).toHaveBeenCalled());

      mockShowConfirmation.mockClear();
      rerender(getComponent());

      /* select all and delete the rest of workspaces */

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all workspaces/i });
      userEvent.click(selectAllCheckbox);

      const deleteSelectedButton = screen.getByRole('button', {
        name: /delete selected workspaces/i,
      });
      expect(deleteSelectedButton).toBeEnabled();
      userEvent.click(deleteSelectedButton);

      expect(mockShowConfirmation).toHaveBeenCalledWith(wantToDelete);
    });
  });

  describe('Table', () => {
    it('should handle workspaces that are being deleted', () => {
      // mute the outputs
      console.error = jest.fn();

      const { rerender } = renderComponent();

      const checkboxes = screen.getAllByRole('checkbox', { name: /select row/i });
      expect(checkboxes[0]).not.toBeChecked();

      isDeleted = [workspaces[0].id];
      rerender(getComponent());

      expect(checkboxes[0]).toBeChecked();
    });

    it('should open actions under kebab button', () => {
      renderComponent();

      // no menu items at all initially
      let menuItems = screen.queryAllByRole('menuitem');
      expect(menuItems.length).toEqual(0);

      const actionButtons = screen.getAllByRole('button', { name: /actions/i });
      // click the kebab button on the first workspace row
      userEvent.click(actionButtons[0]);
      expect(actionButtons[0]).toBeEnabled();

      // check number of menu items shown
      menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toEqual(5);

      // check state of action buttons
      const startDebugAction = screen.getByRole('button', { name: /verbose mode/i });
      expect(startDebugAction).toBeEnabled();

      const openInBackgroundAction = screen.getByRole('button', { name: /background/i });
      expect(openInBackgroundAction).toBeEnabled();

      const restartAction = screen.getByRole('button', { name: /restart/i });
      expect(restartAction).toHaveAttribute('aria-disabled', 'true');

      const stopAction = screen.getByRole('button', { name: /stop workspace/i });
      expect(stopAction).toHaveAttribute('aria-disabled', 'true');

      const deleteAction = screen.getByRole('button', { name: /delete workspace/i });
      expect(deleteAction).toBeEnabled();
    });

    it('should not open the kebab menu while workspace is being deleted', () => {
      // deleting first workspace
      isDeleted = [workspaces[0].id];
      renderComponent();

      const actionButtons = screen.getAllByRole('button', { name: /actions/i });
      // click the kebab button on the first workspace row
      userEvent.click(actionButtons[0]);
      expect(actionButtons[0]).toBeDisabled();
    });

    it('should handle "Open in Verbose mode" action', () => {
      renderComponent();

      const actionButtons = screen.getAllByRole('button', { name: /actions/i });
      // click the kebab button on the first workspace row
      userEvent.click(actionButtons[0]);

      const startDebugAction = screen.getByRole('button', { name: /verbose mode/i });
      userEvent.click(startDebugAction);

      expect(mockOnAction).toHaveBeenCalledWith(
        WorkspaceAction.START_DEBUG_AND_OPEN_LOGS,
        workspaces[0].id,
      );
    });

    it('should handle "Start in Background" action', () => {
      renderComponent();

      const actionButtons = screen.getAllByRole('button', { name: /actions/i });
      // click the kebab button on the first workspace row
      userEvent.click(actionButtons[0]);

      const openInBackgroundAction = screen.getByRole('button', { name: /background/i });
      userEvent.click(openInBackgroundAction);

      expect(mockOnAction).toHaveBeenCalledWith(
        WorkspaceAction.START_IN_BACKGROUND,
        workspaces[0].id,
      );
    });

    it('should handle "Stop Workspace" action', () => {
      const runtime: che.WorkspaceRuntime = {
        machines: {},
        status: WorkspaceStatus.RUNNING,
        activeEnv: 'default',
      };
      workspaces[0] = convertWorkspace(
        createFakeCheWorkspace(
          'workspace-' + 0,
          'workspace-' + 0,
          undefined,
          WorkspaceStatus.RUNNING,
          runtime,
        ),
      );

      renderComponent();

      const actionButtons = screen.getAllByRole('button', { name: /actions/i });
      // click the kebab button on the first workspace row
      userEvent.click(actionButtons[0]);

      const stopAction = screen.getByRole('button', { name: /stop workspace/i });
      userEvent.click(stopAction);

      expect(mockOnAction).toHaveBeenCalledWith(WorkspaceAction.STOP_WORKSPACE, workspaces[0].id);
    });

    it('should handle "Delete Workspace" action', async () => {
      renderComponent();

      const actionButtons = screen.getAllByRole('button', { name: /actions/i });
      // click the kebab button on the first workspace row
      userEvent.click(actionButtons[0]);

      const deleteAction = screen.getByRole('button', { name: /delete workspace/i });
      userEvent.click(deleteAction);

      await waitFor(() => expect(mockOnAction).toHaveBeenCalled());

      expect(mockOnAction).toHaveBeenCalledWith(WorkspaceAction.DELETE_WORKSPACE, workspaces[0].id);
    });
  });

  describe('Empty State', () => {
    it('should handle when no workspaces', () => {
      workspaces = [];
      renderComponent();

      const emptyStateTitle = screen.queryByText(/no workspaces/i);
      expect(emptyStateTitle).toBeTruthy();
    });

    it('should handle filtering when nothing found', () => {
      renderComponent();

      const searchbox = screen.getByRole('searchbox');
      const searchButton = screen.getByRole('button', { name: /filter workspaces/i });

      userEvent.type(searchbox, 'non-existing workspace');
      userEvent.click(searchButton);

      const rowsFiltered = screen.getAllByRole('row');
      // the header row only
      expect(rowsFiltered.length).toEqual(1);

      const emptyStateTitle = screen.queryByRole('heading', { name: /nothing found/i });
      expect(emptyStateTitle).toBeTruthy();
    });
  });
});

function getComponent(): React.ReactElement {
  const history = createHashHistory();
  return (
    <WorkspacesList
      branding={brandingData}
      history={history}
      workspaces={workspaces}
      onAction={mockOnAction}
      showConfirmation={mockShowConfirmation}
      toDelete={isDeleted}
    ></WorkspacesList>
  );
}
function renderComponent(): RenderResult {
  return render(getComponent());
}
