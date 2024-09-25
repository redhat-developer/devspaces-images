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

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider } from 'react-redux';
import { Location, MemoryRouter } from 'react-router-dom';

import { Props, WorkspaceDetails } from '@/pages/WorkspaceDetails';
import devfileApi from '@/services/devfileApi';
import { constructWorkspace } from '@/services/workspace-adapter';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

const mockOnSave = jest.fn();

jest.mock('@/pages/WorkspaceDetails/DevfileEditorTab');
jest.mock('@/pages/WorkspaceDetails/OverviewTab');
jest.mock('@/components/WorkspaceLogs');
jest.mock('@/components/WorkspaceEvents');

const workspaceName = 'wksp';
const namespace = 'che-user';

describe('Workspace Details page', () => {
  let devWorkspaceBuilder: DevWorkspaceBuilder;

  beforeEach(() => {
    // history = createHashHistory();
    devWorkspaceBuilder = new DevWorkspaceBuilder()
      .withName(workspaceName)
      .withNamespace(namespace);
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.location.href = '/';
  });

  it('should show Workspace not found', () => {
    renderComponent();

    expect(screen.queryByText('Workspace not found.')).toBeTruthy();
  });

  describe('Tabs', () => {
    it('should activate the Overview tab by default', () => {
      const workspace = constructWorkspace(devWorkspaceBuilder.build());
      renderComponent({
        workspace,
      });

      const tabpanel = screen.queryByRole('tabpanel', { name: 'Overview' });
      expect(tabpanel).not.toBeNull();
    });

    it('should have four tabs visible', () => {
      const workspace = constructWorkspace(devWorkspaceBuilder.build());
      renderComponent({
        workspace,
      });

      const allTabs = screen.getAllByRole('tab');
      expect(allTabs.length).toBe(4);

      const overviewTab = screen.queryByRole('tab', { name: 'Overview' });
      const devfileTab = screen.queryByRole('tab', { name: 'Devfile' });
      const logsTab = screen.queryByRole('tab', { name: 'Logs' });
      const eventsTab = screen.queryByRole('tab', { name: 'Events' });

      expect(overviewTab).not.toBeNull();
      expect(devfileTab).not.toBeNull();
      expect(logsTab).not.toBeNull();
      expect(eventsTab).not.toBeNull();
    });

    it('should switch to the Devfile tab', async () => {
      const workspace = constructWorkspace(devWorkspaceBuilder.build());
      renderComponent({
        workspace,
      });

      const devfileTab = screen.getByRole('tab', { name: 'Devfile' });
      await userEvent.click(devfileTab);

      const tabpanel = screen.getByRole('tabpanel', { name: 'Devfile' });
      expect(tabpanel).not.toBeNull();
    });
  });

  describe('Old workspace link', () => {
    it('should NOT show the link', () => {
      const workspace = constructWorkspace(devWorkspaceBuilder.build());
      renderComponent({
        workspace,
      });
      expect(screen.queryByRole('link', { name: 'Show Original Devfile' })).toBeFalsy();
    });

    it('should show the link', () => {
      const workspace = constructWorkspace(devWorkspaceBuilder.build());
      const oldWorkspacePath: Location = {
        key: 'old-workspace-key',
        hash: '',
        pathname: '/workspace/che-user/che-wksp',
        search: '',
        state: undefined,
      };
      renderComponent({
        workspace,
        oldWorkspaceLocation: oldWorkspacePath,
      });
      expect(screen.queryByRole('link', { name: 'Show Original Devfile' })).toBeTruthy();
    });
  });

  it('should handle the onSave event', async () => {
    const workspace = constructWorkspace(devWorkspaceBuilder.build());
    renderComponent({
      workspace,
    });

    const saveButton = screen.getByRole('button', { name: 'Update workspace' });
    await userEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });
});

function renderComponent(props?: Partial<Props>): void {
  const workspaces = props?.workspace ? [props.workspace.ref as devfileApi.DevWorkspace] : [];
  const store = new FakeStoreBuilder().withDevWorkspaces({ workspaces }).build();
  const location = {
    key: 'workspace-details-key',
    pathname: `/workspace/${namespace}/${workspaceName}`,
  } as Location;
  render(
    <MemoryRouter>
      <Provider store={store}>
        <WorkspaceDetails
          location={location}
          navigate={jest.fn()}
          isLoading={props?.isLoading || false}
          oldWorkspaceLocation={props?.oldWorkspaceLocation}
          workspace={props?.workspace}
          workspacesLink={props?.workspacesLink || '/workspaces'}
          onSave={mockOnSave}
        />
      </Provider>
    </MemoryRouter>,
  );
}
