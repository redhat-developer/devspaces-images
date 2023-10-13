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

import { render, screen } from '@testing-library/react';
import { createHashHistory, History, Location } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { Router } from 'react-router';

import devfileApi from '@/services/devfileApi';
import { constructWorkspace } from '@/services/workspace-adapter';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

import { Props, WorkspaceDetails } from '..';

const mockOnSave = jest.fn();

jest.mock('../DevfileEditorTab');
jest.mock('../OverviewTab/StorageType');

jest.mock('../DevworkspaceEditorTab', () => {
  return () => '';
});

let history: History;

describe('Workspace Details page', () => {
  let devWorkspaceBuilder: DevWorkspaceBuilder;
  const workspaceName = 'wksp';

  beforeEach(() => {
    history = createHashHistory();
    devWorkspaceBuilder = new DevWorkspaceBuilder()
      .withName(workspaceName)
      .withNamespace('user-che');
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
      expect(tabpanel).toBeTruthy();
    });

    it('should have two tabs visible', () => {
      const workspace = constructWorkspace(devWorkspaceBuilder.build());
      renderComponent({
        workspace,
      });

      const overviewTab = screen.queryByRole('tab', { name: 'Overview' });
      const devfileTab = screen.queryByRole('tab', { name: 'Devfile' });

      expect(overviewTab).toBeTruthy();
      expect(devfileTab).toBeTruthy();
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
});

function renderComponent(props?: Partial<Props>): void {
  const workspaces = props?.workspace ? [props.workspace.ref as devfileApi.DevWorkspace] : [];
  const store = new FakeStoreBuilder().withDevWorkspaces({ workspaces }).build();
  render(
    <Router history={history}>
      <Provider store={store}>
        <WorkspaceDetails
          history={history}
          isLoading={props?.isLoading || false}
          oldWorkspaceLocation={props?.oldWorkspaceLocation}
          workspace={props?.workspace}
          workspacesLink={props?.workspacesLink || '/workspaces'}
          onSave={mockOnSave}
        />
      </Provider>
    </Router>,
  );
}
