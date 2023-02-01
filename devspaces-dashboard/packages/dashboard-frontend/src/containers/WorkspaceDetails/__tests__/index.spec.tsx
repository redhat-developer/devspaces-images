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
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import WorkspaceDetailsContainer from '..';
import { getMockRouterProps } from '../../../services/__mocks__/router';
import { ROUTE } from '../../../Routes/routes';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';
import { constructWorkspace, WorkspaceAdapter } from '../../../services/workspace-adapter';
import {
  ActionCreators,
  actionCreators as workspacesActionCreators,
} from '../../../store/Workspaces';
import { DevWorkspaceBuilder } from '../../../store/__mocks__/devWorkspaceBuilder';

const mockUpdateWorkspace = jest.fn();

jest.mock('../../../store/Workspaces');
(workspacesActionCreators.requestWorkspaces as jest.Mock).mockImplementation(() => async () => {
  // no-op
});
(workspacesActionCreators.updateWorkspace as jest.Mock).mockImplementation(
  (...args) =>
    async () =>
      mockUpdateWorkspace(...args),
);

jest.mock('../../../pages/WorkspaceDetails');

describe('Workspace Details container', () => {
  const namespace = 'user-dev';

  const prevWorkspaceId = 'prev-wksp-id';
  const prevWorkspaceName = 'prev-wksp';
  const nextWorkspaceId = 'next-wksp-id';
  const nextWorkspaceName = 'next-wksp';

  let prevWorkspaceBuilder: DevWorkspaceBuilder;
  let nextWorkspaceBuilder: DevWorkspaceBuilder;
  let prevStoreBuilder: FakeStoreBuilder;
  let nextStoreBuilder: FakeStoreBuilder;

  type Props = {
    namespace: string;
    workspaceName: string;
  };
  let prevRouteProps: RouteComponentProps<Props>;
  let nextRouteProps: RouteComponentProps<Props>;

  beforeEach(() => {
    prevRouteProps = getMockRouterProps(ROUTE.WORKSPACE_DETAILS, {
      namespace,
      workspaceName: prevWorkspaceName,
    });
    nextRouteProps = getMockRouterProps(ROUTE.WORKSPACE_DETAILS, {
      namespace,
      workspaceName: nextWorkspaceName,
    });
    prevWorkspaceBuilder = new DevWorkspaceBuilder()
      .withId(prevWorkspaceId)
      .withName(prevWorkspaceName)
      .withNamespace(namespace);
    nextWorkspaceBuilder = new DevWorkspaceBuilder()
      .withId(nextWorkspaceId)
      .withName(nextWorkspaceName)
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
    const workspace = prevWorkspaceBuilder.build();
    const store = prevStoreBuilder.withDevWorkspaces({ workspaces: [workspace] }).build();

    render(
      <Provider store={store}>
        <WorkspaceDetailsContainer {...prevRouteProps} />
      </Provider>,
    );

    const workspaceIdEl = screen.queryByTestId('props-workspace-id');
    expect(workspaceIdEl).toBeTruthy();
    expect(workspaceIdEl).toHaveTextContent(prevWorkspaceId);
  });

  it('should sanitize the page location', () => {
    const workspaceNameWithParams = `${prevWorkspaceName}&another-param=true`;
    const props = getMockRouterProps(ROUTE.WORKSPACE_DETAILS, {
      namespace,
      workspaceName: workspaceNameWithParams,
    });

    const workspace = prevWorkspaceBuilder.build();
    const store = prevStoreBuilder.withDevWorkspaces({ workspaces: [workspace] }).build();

    render(
      <Provider store={store}>
        <WorkspaceDetailsContainer {...props} />
      </Provider>,
    );

    const expectedLocation = `/workspace/${namespace}/${prevWorkspaceName}`;
    expect(props.history.location.pathname).toEqual(expectedLocation);
    expect(props.history.location.search).toEqual('');
  });

  it('should not change location if fetching data', () => {
    const prevWorkspace = prevWorkspaceBuilder.build();

    const prevStore = prevStoreBuilder
      .withDevWorkspaces({ workspaces: [prevWorkspace] }, false)
      .build();

    // render an existing workspace page
    const { rerender } = render(
      <Provider store={prevStore}>
        <WorkspaceDetailsContainer {...prevRouteProps} />
      </Provider>,
    );

    const prevWorkspaceIdEl = screen.getByTestId('props-workspace-id');

    // change location to another workspace page
    const nextStore = nextStoreBuilder
      // workspaces are fetching
      .withWorkspaces({}, true)
      // the next workspace hasn't been fetched yet
      .withDevWorkspaces({ workspaces: [prevWorkspace] }, true)
      .build();

    rerender(
      <Provider store={nextStore}>
        <WorkspaceDetailsContainer {...nextRouteProps} />
      </Provider>,
    );

    expect(prevWorkspaceIdEl).toBeInTheDocument();
  });

  it('should change location when fetching data is done', async () => {
    const prevWorkspace = prevWorkspaceBuilder.build();
    const prevStore = prevStoreBuilder.withDevWorkspaces({ workspaces: [prevWorkspace] }).build();

    // render an existing workspace page
    const { rerender } = render(
      <Provider store={prevStore}>
        <WorkspaceDetailsContainer {...prevRouteProps} />
      </Provider>,
    );

    expect(screen.getByTestId('props-workspace-id')).toHaveTextContent(
      WorkspaceAdapter.getId(prevWorkspace),
    );

    // change location to another workspace page
    const nextWorkspace = nextWorkspaceBuilder.build();
    const nextStore = nextStoreBuilder
      // the next workspace is fetched
      .withDevWorkspaces({ workspaces: [prevWorkspace, nextWorkspace] })
      .build();

    rerender(
      <Provider store={nextStore}>
        <WorkspaceDetailsContainer {...nextRouteProps} />
      </Provider>,
    );

    const nextWorkspaceIdEl = screen.queryByTestId('props-workspace-id');
    expect(nextWorkspaceIdEl).toHaveTextContent(WorkspaceAdapter.getId(nextWorkspace));
  });

  it('should update the workspace', () => {
    const workspace = prevWorkspaceBuilder.build();
    const store = prevStoreBuilder.withDevWorkspaces({ workspaces: [workspace] }).build();

    render(
      <Provider store={store}>
        <WorkspaceDetailsContainer {...prevRouteProps} />
      </Provider>,
    );

    const saveButton = screen.getByRole('button', { name: 'Save' });
    userEvent.click(saveButton);

    expect(mockUpdateWorkspace).toHaveBeenCalledWith<Parameters<ActionCreators['updateWorkspace']>>(
      constructWorkspace(workspace),
    );
  });

  describe('workspace actions', () => {
    it('should open the workspaces list after deleting the workspace', async () => {
      const workspace1 = new DevWorkspaceBuilder()
        .withId('wksp-id-1')
        .withName('wksp-1')
        .withNamespace(namespace)
        .build();
      const workspace2 = new DevWorkspaceBuilder()
        .withId('wksp-id-2')
        .withName('wksp-2')
        .withNamespace(namespace)
        .build();

      const prevStore = new FakeStoreBuilder()
        .withInfrastructureNamespace([{ name: namespace, attributes: { phase: 'Active' } }], false)
        .withDevWorkspaces({ workspaces: [workspace1, workspace2] })
        .build();
      const prevRouteProps = getMockRouterProps(ROUTE.WORKSPACE_DETAILS, {
        namespace,
        workspaceName: prevWorkspaceName,
      });

      // render an existing workspace page
      const { rerender } = render(
        <Provider store={prevStore}>
          <WorkspaceDetailsContainer {...prevRouteProps} />
        </Provider>,
      );

      // remove workspace1 from store
      const nextStore = new FakeStoreBuilder()
        .withInfrastructureNamespace([{ name: namespace, attributes: { phase: 'Active' } }], false)
        .withDevWorkspaces({ workspaces: [workspace2] })
        .build();
      const nextRouteProps = getMockRouterProps(ROUTE.WORKSPACE_DETAILS, {
        namespace,
        workspaceName: prevWorkspaceName,
      });

      const spyHistoryPush = jest.spyOn(nextRouteProps.history, 'push');

      rerender(
        <Provider store={nextStore}>
          <WorkspaceDetailsContainer {...nextRouteProps} />
        </Provider>,
      );

      await waitFor(() => expect(spyHistoryPush).toHaveBeenCalled());
    });
  });
});
