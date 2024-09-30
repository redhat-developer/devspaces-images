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

import { render, RenderResult, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import React from 'react';
import { Router } from 'react-router';

import { BrandingData } from '@/services/bootstrap/branding.constant';
import { constructWorkspace, Workspace } from '@/services/workspace-adapter';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';

import WorkspacesList from '..';

jest.mock('@/components/Head', () => {
  const FakeHead = () => {
    return <span>Dummy Head Component</span>;
  };
  FakeHead.displayName = 'fake-Head';
  return FakeHead;
});
jest.mock('@/components/Workspace/Status/Indicator');
jest.mock('@/contexts/WorkspaceActions');
jest.mock('@/contexts/WorkspaceActions/BulkDeleteButton');
jest.mock('@/contexts/WorkspaceActions/Dropdown');

const history = createMemoryHistory();

const brandingData = {
  docs: {
    workspace: 'workspaces/documentation/link',
  },
} as BrandingData;

let workspaces: Workspace[];

describe('Workspaces List Page', () => {
  beforeEach(() => {
    workspaces = [0, 1, 2, 3, 4]
      .map(i =>
        new DevWorkspaceBuilder()
          .withUID('workspace-' + i)
          .withName('workspace-' + i)
          .withNamespace('che')
          .build(),
      )
      .map(workspace => constructWorkspace(workspace));
  });

  afterEach(() => {
    jest.clearAllMocks();
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
    it('should select all rows', async () => {
      renderComponent();

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all workspaces/i });
      const rowCheckboxes = screen.getAllByRole('checkbox', { name: /select row/i });

      rowCheckboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked();
      });

      // select all workspaces
      await await userEvent.click(selectAllCheckbox);

      rowCheckboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });

      // deselect all workspaces
      await userEvent.click(selectAllCheckbox);

      rowCheckboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked();
      });
    });

    it('should filter rows', async () => {
      renderComponent();

      const searchbox = screen.getByRole('searchbox');
      const searchButton = screen.getByRole('button', { name: /filter workspaces/i });

      const rows = screen.getAllByRole('row');
      // including the header row
      expect(rows.length).toEqual(workspaces.length + 1);

      await userEvent.type(searchbox, workspaces[0].name);
      await userEvent.click(searchButton);

      const rowsFiltered = screen.getAllByRole('row');
      // including the header row
      expect(rowsFiltered.length).toEqual(2);
    });

    it('should bulk select visible workspaces only', async () => {
      renderComponent();

      const searchbox = screen.getByRole('searchbox');
      const searchButton = screen.getByRole('button', { name: /filter workspaces/i });

      await userEvent.type(searchbox, workspaces[0].name);
      await userEvent.click(searchButton);

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
      await userEvent.click(selectAllCheckbox);

      const bulkDeleteElem = screen.getByTestId('workspace-actions-bulk-delete');
      const workspacesNumber = within(bulkDeleteElem).getByTestId('workspaces-number');
      expect(workspacesNumber).toHaveTextContent('1');
    });
  });

  describe('Table', () => {
    it('should select a row', async () => {
      renderComponent();

      const rowCheckboxes = screen.getAllByRole('checkbox', { name: /select row/i });

      const rowCheckbox = rowCheckboxes[0];
      expect(rowCheckbox).not.toBeChecked();

      await userEvent.click(rowCheckbox);

      expect(rowCheckbox).toBeChecked();
    });
  });

  describe('Empty State', () => {
    it('should handle when no workspaces', () => {
      workspaces = [];
      renderComponent();

      const emptyStateTitle = screen.queryByText(/no workspaces/i);
      expect(emptyStateTitle).toBeTruthy();
    });

    it('should handle filtering when nothing found', async () => {
      renderComponent();

      const searchbox = screen.getByRole('searchbox');
      const searchButton = screen.getByRole('button', { name: /filter workspaces/i });

      await userEvent.type(searchbox, 'non-existing workspace');
      await userEvent.click(searchButton);

      const rowsFiltered = screen.getAllByRole('row');
      // the header row only
      expect(rowsFiltered.length).toEqual(1);

      const emptyStateTitle = screen.queryByRole('heading', { name: /nothing found/i });
      expect(emptyStateTitle).toBeTruthy();
    });
  });
});

function getComponent(_workspaces = workspaces): React.ReactElement {
  return (
    <Router history={history}>
      <WorkspacesList
        branding={brandingData}
        history={history}
        workspaces={_workspaces}
      ></WorkspacesList>
    </Router>
  );
}
function renderComponent(workspaces?: Workspace[]): RenderResult {
  return render(getComponent(workspaces));
}
