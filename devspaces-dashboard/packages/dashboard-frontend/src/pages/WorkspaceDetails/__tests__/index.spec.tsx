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

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createHashHistory, History, Location } from 'history';
import { Provider } from 'react-redux';
import { Router } from 'react-router';
import { WorkspaceDetails, Props } from '..';
import { DevWorkspaceBuilder } from '../../../store/__mocks__/devWorkspaceBuilder';
import { CheWorkspaceBuilder } from '../../../store/__mocks__/cheWorkspaceBuilder';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';
import { constructWorkspace } from '../../../services/workspace-adapter';
import devfileApi from '../../../services/devfileApi';

const mockOnConvert = jest.fn();
const mockOnSave = jest.fn();

jest.mock('../EditorTab');
jest.mock('../OverviewTab/StorageType');

let history: History;

describe('Workspace Details page', () => {
  let cheWorkspaceBuilder: CheWorkspaceBuilder;
  let devWorkspaceBuilder: DevWorkspaceBuilder;
  const workspaceName = 'wksp';

  beforeEach(() => {
    history = createHashHistory();
    cheWorkspaceBuilder = new CheWorkspaceBuilder()
      .withName(workspaceName)
      .withNamespace('user-dev');
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

      const overviewTab = screen.getByRole('button', { name: 'Overview' });
      const devfileTab = screen.getByRole('button', { name: 'Devfile' });

      expect(overviewTab).toBeTruthy();
      expect(devfileTab).toBeTruthy();
    });

    it('should show the Devfile tab content', () => {
      const workspace = constructWorkspace(devWorkspaceBuilder.build());
      renderComponent({
        workspace,
      });

      const devfileTab = screen.getByRole('button', { name: 'Devfile' });
      userEvent.click(devfileTab);

      const fakeEditor = screen.queryByText('Fake Editor Tab');
      expect(fakeEditor).toBeTruthy();
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

  describe('Convert button', () => {
    it('should NOT show the button', () => {
      const workspace = constructWorkspace(cheWorkspaceBuilder.build());
      renderComponent({
        workspace,
      });
      expect(screen.queryByRole('button', { name: 'Convert' })).toBeFalsy();
    });

    it('should show the button', () => {
      const workspace = constructWorkspace(cheWorkspaceBuilder.build());
      renderComponent({
        workspace,
        showConvertButton: true,
      });
      expect(screen.queryByRole('button', { name: 'Convert' })).toBeTruthy();
    });
  });

  describe('Conversion', () => {
    it('should NOT show alert', async () => {
      const workspace = constructWorkspace(cheWorkspaceBuilder.build());

      renderComponent({
        workspace,
        showConvertButton: true,
      });

      const convertButton = screen.getByRole('button', { name: 'Convert' });
      userEvent.click(convertButton);

      await waitFor(() => expect(mockOnConvert).toHaveBeenCalled());

      const closeButton = screen.queryByRole('button', { name: /workspace conversion failed/i });
      expect(closeButton).toBeFalsy();

      const alertHeading = screen.queryByRole('heading', { name: /workspace conversion failed/i });
      expect(alertHeading).toBeFalsy();
    });

    it('should show alert', async () => {
      const workspace = constructWorkspace(cheWorkspaceBuilder.build());

      mockOnConvert.mockImplementationOnce(() => {
        throw new Error('Failed.');
      });
      renderComponent({
        workspace,
        showConvertButton: true,
      });

      const convertButton = screen.getByRole('button', { name: 'Convert' });
      userEvent.click(convertButton);

      await waitFor(() => expect(mockOnConvert).toHaveBeenCalled());

      const closeButton = screen.queryByRole('button', { name: /workspace conversion failed/i });
      expect(closeButton).toBeTruthy();

      const alertHeading = screen.queryByRole('heading', { name: /workspace conversion failed/i });
      expect(alertHeading).toBeTruthy();
    });

    it('should close conversion alert', async () => {
      const workspace = constructWorkspace(cheWorkspaceBuilder.build());

      mockOnConvert.mockImplementationOnce(() => {
        throw new Error('Failed.');
      });
      renderComponent({
        workspace,
        showConvertButton: true,
      });

      const convertButton = screen.getByRole('button', { name: 'Convert' });
      userEvent.click(convertButton);

      await waitFor(() => expect(mockOnConvert).toHaveBeenCalled());

      const closeButton = screen.getByRole('button', { name: /workspace conversion failed/i });
      userEvent.click(closeButton);

      const alertHeading = screen.queryByRole('headiing', { name: /workspace conversion failed/i });
      expect(alertHeading).toBeFalsy();
    });
  });

  describe('Saving changes', () => {
    test('successfully saved changes', async () => {
      const workspace = constructWorkspace(devWorkspaceBuilder.build());

      const spyHistoryReplace = jest.spyOn(history, 'replace');

      renderComponent({
        workspace,
      });

      const devfileTab = screen.getByRole('button', { name: 'Devfile' });
      userEvent.click(devfileTab);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      userEvent.click(saveButton);

      await waitFor(() => expect(mockOnSave).toHaveBeenCalled());
      await waitFor(() => expect(spyHistoryReplace).toHaveBeenCalled());

      spyHistoryReplace.mockReset();
    });

    test('failure when saving changes', async () => {
      const workspace = constructWorkspace(devWorkspaceBuilder.build());

      const spyHistoryReplace = jest.spyOn(history, 'replace');
      mockOnSave.mockImplementationOnce(() => {
        throw new Error('Failed.');
      });

      renderComponent({
        workspace,
      });

      const devfileTab = screen.getByRole('button', { name: 'Devfile' });
      userEvent.click(devfileTab);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      userEvent.click(saveButton);

      await waitFor(() => expect(mockOnSave).toHaveBeenCalled());

      const errorMessage = screen.queryByTestId('current-request-error');
      await waitFor(() => expect(errorMessage).toHaveTextContent('Failed.'));

      expect(spyHistoryReplace).not.toHaveBeenCalled();
      spyHistoryReplace.mockReset();
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
          showConvertButton={props?.showConvertButton || false}
          workspace={props?.workspace}
          workspacesLink={props?.workspacesLink || '/workspaces'}
          onConvert={mockOnConvert}
          onSave={mockOnSave}
        />
      </Provider>
    </Router>,
  );
}
