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
import { Provider } from 'react-redux';

import { OverviewTab } from '@/pages/WorkspaceDetails/OverviewTab';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';
import { constructWorkspace, Workspace } from '@/services/workspace-adapter';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

jest.mock('@/pages/WorkspaceDetails/OverviewTab/InfrastructureNamespace');
jest.mock('@/pages/WorkspaceDetails/OverviewTab/Projects');
jest.mock('@/pages/WorkspaceDetails/OverviewTab/StorageType');
jest.mock('@/pages/WorkspaceDetails/OverviewTab/WorkspaceName');

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

const mockOnSave = jest.fn();

describe('OverviewTab', () => {
  let workspace: Workspace;

  beforeEach(() => {
    const devWorkspace = new DevWorkspaceBuilder().withName('my-project').build();
    workspace = constructWorkspace(devWorkspace);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('screenshot', () => {
    const snapshot = createSnapshot(workspace);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('change storage type', async () => {
    renderComponent(workspace);
    expect(mockOnSave).not.toHaveBeenCalled();

    const changeStorageType = screen.getByRole('button', { name: 'Change storage type' });

    await userEvent.click(changeStorageType);

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({ storageType: 'per-workspace' }),
    );
  });
});

function getComponent(workspace: Workspace) {
  const store = new FakeStoreBuilder().build();
  return (
    <Provider store={store}>
      <OverviewTab onSave={mockOnSave} workspace={workspace} />
    </Provider>
  );
}
