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

import { fireEvent, render, RenderResult, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { constructWorkspace, Workspace } from '@/services/workspace-adapter';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';

import WorkspacesListToolbar from '..';

let workspaces: Workspace[];
let isSelectedAll: boolean;
let isEnabledDelete: boolean;
const mockOnAddWorkspace = jest.fn();
const mockOnBulkDelete = jest.fn();
const mockOnFilter = jest.fn();
const mockOnToggleSelectAll = jest.fn();

describe('Workspaces List Toolbar', () => {
  function renderComponent(): RenderResult {
    return render(
      <WorkspacesListToolbar
        workspaces={workspaces}
        selectedAll={isSelectedAll}
        enabledDelete={isEnabledDelete}
        onAddWorkspace={() => mockOnAddWorkspace()}
        onBulkDelete={() => mockOnBulkDelete()}
        onFilter={filtered => mockOnFilter(filtered)}
        onToggleSelectAll={isSelectedAll => mockOnToggleSelectAll(isSelectedAll)}
      />,
    );
  }

  beforeEach(() => {
    workspaces = [0, 1, 2, 3, 4]
      .map(i =>
        new DevWorkspaceBuilder()
          .withUID('workspace-' + i)
          .withName('workspace-' + i)
          .build(),
      )
      .map(workspace => constructWorkspace(workspace));
    isSelectedAll = false;
    isEnabledDelete = false;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    renderComponent();

    // "Select All Workspaces" checkbox
    const checkbox = screen.queryByRole('checkbox', { name: /select all workspaces/i });
    expect(checkbox).toBeTruthy();
    expect(checkbox).not.toBeChecked();

    // Workspaces filtering searchbox
    expect(screen.queryByRole('searchbox')).toBeTruthy();

    // "Filter Workspaces" button
    expect(screen.queryByRole('button', { name: /filter workspaces/i })).toBeTruthy();

    // "Delete selected workspaces" button
    const deleteButton = screen.queryByRole('button', { name: /delete selected workspaces/i });
    expect(deleteButton).toBeTruthy();
    expect(deleteButton).toBeDisabled();

    // "Add Workspace" button
    const addButton = screen.queryByRole('button', { name: /new workspace/i });
    expect(addButton).toBeTruthy();
    expect(addButton).toBeEnabled();
  });

  it('should emit event when selecting all workspaces', () => {
    renderComponent();

    const checkbox = screen.getByRole('checkbox', { name: /select all workspaces/i });

    userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(mockOnToggleSelectAll).toHaveBeenCalledWith(true);

    userEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(mockOnToggleSelectAll).toHaveBeenCalledWith(false);
  });

  it('should emit event when filtering workspaces', () => {
    renderComponent();

    const searchbox = screen.getByRole('searchbox');
    const searchButton = screen.getByRole('button', { name: /filter workspaces/i });

    userEvent.type(searchbox, workspaces[0].devfile.metadata.name!);
    userEvent.click(searchButton);

    expect(mockOnFilter).toHaveBeenCalledWith([workspaces[0]]);
  });

  it('should emit event when deleting selected workspaces', () => {
    isEnabledDelete = true;
    renderComponent();

    const deleteButton = screen.getByRole('button', { name: /delete selected workspaces/i });

    expect(deleteButton).toBeEnabled();

    userEvent.click(deleteButton);
    expect(mockOnBulkDelete).toHaveBeenCalled();
  });

  it('should emit event when adding a new workspace', () => {
    renderComponent();

    const addButton = screen.getByRole('button', { name: /new workspace/i });

    userEvent.click(addButton);
    expect(mockOnAddWorkspace).toHaveBeenCalled();
  });

  it('should filter workspaces by hitting Enter key', () => {
    renderComponent();

    const searchbox = screen.getByRole('searchbox');

    userEvent.type(searchbox, workspaces[2].devfile.metadata.name!);
    const enterKeydown = new KeyboardEvent('keydown', { code: 'Enter', key: 'a' });
    fireEvent(searchbox, enterKeydown);

    expect(mockOnFilter).toHaveBeenCalledWith([workspaces[2]]);
  });

  it('should clear filter when Escape is pressed', () => {
    renderComponent();

    const searchbox = screen.getByRole('searchbox');

    userEvent.type(searchbox, workspaces[2].devfile.metadata.name!);
    const escapeKeydown = new KeyboardEvent('keydown', { code: 'Escape', key: 'a' });
    fireEvent(searchbox, escapeKeydown);

    expect(mockOnFilter).toHaveBeenCalledWith(workspaces);
  });
});
