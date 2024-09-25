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

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InitialEntry } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { Store } from 'redux';

import { ROUTE } from '@/Routes';
import getComponentRenderer from '@/services/__mocks__/getComponentRenderer';
import { constructWorkspace } from '@/services/workspace-adapter';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { actionCreators as workspacesActionCreators } from '@/store/Workspaces';

import WorkspaceDetailsContainer from '..';

const mockUpdateWorkspace = jest.fn();

const { renderComponent } = getComponentRenderer(getComponent);

jest.mock('@/store/Workspaces');
(workspacesActionCreators.requestWorkspaces as jest.Mock).mockImplementation(() => async () => {
  // no-op
});
(workspacesActionCreators.updateWorkspace as jest.Mock).mockImplementation(
  (...args) =>
    async () =>
      mockUpdateWorkspace(...args),
);

jest.mock('@/pages/WorkspaceDetails');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

const mockNavigate = jest.fn();
(useNavigate as any).mockReturnValue(mockNavigate);

describe('Workspace Details container', () => {
  const namespace = 'user-dev';

  const workspaceId_1 = 'wksp-id-1';
  const workspaceName_1 = 'wksp-name-1';
  const workspaceId_2 = 'wksp-id-2';
  const workspaceName_2 = 'wksp-name-2';

  let workspaceBuilder_1: DevWorkspaceBuilder;
  let workspaceBuilder_2: DevWorkspaceBuilder;
  let prevStoreBuilder: FakeStoreBuilder;
  let nextStoreBuilder: FakeStoreBuilder;

  beforeEach(() => {
    workspaceBuilder_1 = new DevWorkspaceBuilder()
      .withId(workspaceId_1)
      .withName(workspaceName_1)
      .withNamespace(namespace);
    workspaceBuilder_2 = new DevWorkspaceBuilder()
      .withId(workspaceId_2)
      .withName(workspaceName_2)
      .withNamespace(namespace);
    prevStoreBuilder = new FakeStoreBuilder().withInfrastructureNamespace(
      [{ name: namespace, attributes: { phase: 'Active' } }],
      false,
    );
    nextStoreBuilder = new FakeStoreBuilder().withInfrastructureNamespace(
      [{ name: namespace, attributes: { phase: 'Active' } }],
      false,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the Workspace Details page', () => {
    const workspace = workspaceBuilder_1.build();
    const store = prevStoreBuilder.withDevWorkspaces({ workspaces: [workspace] }).build();

    const initialEntries = [`/workspace/${namespace}/${workspaceName_1}`];
    renderComponent(store, initialEntries);

    const workspaceIdEl = screen.queryByTestId('props-workspace-id');
    expect(workspaceIdEl).toBeTruthy();
    expect(workspaceIdEl).toHaveTextContent(workspaceId_1);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should sanitize the page location', async () => {
    const workspaceNameWithParams = `${workspaceName_1}&another-param=true`;

    const workspace = workspaceBuilder_1.build();
    const store = prevStoreBuilder.withDevWorkspaces({ workspaces: [workspace] }).build();

    const initialEntries = [`/workspace/${namespace}/${workspaceNameWithParams}`];
    renderComponent(store, initialEntries);

    expect(mockNavigate).toHaveBeenCalledWith(`/workspace/${namespace}/${workspaceName_1}`, {
      replace: true,
    });
  });

  it('should not change location if fetching data', () => {
    const prevWorkspace = workspaceBuilder_1.build();
    const prevStore = prevStoreBuilder
      .withDevWorkspaces({ workspaces: [prevWorkspace] }, false)
      .build();

    // render an existing workspace page
    const { reRenderComponent } = renderComponent(prevStore, [
      `/workspace/${namespace}/${workspaceName_1}`,
    ]);

    const workspaceId = screen.getByTestId('props-workspace-id');

    // change location to another workspace page
    const nextStore = nextStoreBuilder
      // workspaces are fetching
      .withWorkspaces({}, true)
      // the next workspace hasn't been fetched yet
      .withDevWorkspaces({ workspaces: [prevWorkspace] }, true)
      .build();

    reRenderComponent(nextStore, [`/workspace/${namespace}/${workspaceName_2}`]);

    expect(workspaceId).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should update the workspace', async () => {
    const workspace = workspaceBuilder_1.build();
    const store = prevStoreBuilder.withDevWorkspaces({ workspaces: [workspace] }).build();

    renderComponent(store, [`/workspace/${namespace}/${workspaceName_1}`]);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    await userEvent.click(saveButton);

    expect(mockUpdateWorkspace).toHaveBeenCalledWith(constructWorkspace(workspace));
  });

  describe('workspace actions', () => {
    it('should open the workspaces list after deleting the workspace', async () => {
      const workspace1 = workspaceBuilder_1.build();
      const workspace2 = workspaceBuilder_2.build();

      const prevStore = new FakeStoreBuilder()
        .withInfrastructureNamespace([{ name: namespace, attributes: { phase: 'Active' } }], false)
        .withDevWorkspaces({ workspaces: [workspace1, workspace2] })
        .build();
      const { reRenderComponent } = renderComponent(prevStore, [
        `/workspace/${namespace}/${workspaceName_1}`,
      ]);

      // remove workspace1 from store
      const nextStore = new FakeStoreBuilder()
        .withInfrastructureNamespace([{ name: namespace, attributes: { phase: 'Active' } }], false)
        .withDevWorkspaces({ workspaces: [workspace2] })
        .build();
      reRenderComponent(nextStore, [`/workspace/${namespace}/${workspaceName_1}`]);

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: ROUTE.WORKSPACES }),
      );
    });
  });
});

function getComponent(store: Store, initialEntries: InitialEntry[]) {
  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path={ROUTE.WORKSPACE_DETAILS} element={<WorkspaceDetailsContainer />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}
