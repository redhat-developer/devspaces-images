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
import renderer, { ReactTestRenderer } from 'react-test-renderer';
import { Store } from 'redux';
import { Provider } from 'react-redux';
import IdeLoaderTabs from '..';
import { LoadIdeSteps } from '../../../containers/IdeLoader';
import { DeprecatedWorkspaceStatus, WorkspaceStatus } from '../../../services/helpers/types';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';
import { createFakeCheWorkspace } from '../../../store/__mocks__/workspace';

jest.mock('../../../services/helpers/tools', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getBlobUrl: (logs: string): string => '',
  };
});

jest.mock('react-tooltip', () => {
  return function DummyTooltip(): React.ReactElement {
    return <div>Dummy Tooltip</div>;
  };
});

const workspaceName = 'wksp-test';
const workspaceId = 'testWorkspaceId';

describe('The Ide Loader page  component', () => {
  it('should render INITIALIZING step correctly', () => {
    const currentStep = LoadIdeSteps.INITIALIZING;
    const hasError = false;
    const workspace = createFakeCheWorkspace(workspaceId, workspaceName);
    const store = new FakeStoreBuilder()
      .withCheWorkspaces({
        workspaces: [workspace],
      })
      .build();

    const component = renderComponent(
      store,
      currentStep,
      workspaceName,
      workspaceId,
      hasError,
      workspace.status as WorkspaceStatus,
    );

    expect(component.toJSON()).toMatchSnapshot();
  });

  it('should render INITIALIZING step with an error correctly', () => {
    const currentStep = LoadIdeSteps.INITIALIZING;
    const hasError = true;
    const workspace = createFakeCheWorkspace(
      workspaceId,
      workspaceName,
      undefined,
      WorkspaceStatus.ERROR,
    );
    const store = new FakeStoreBuilder()
      .withCheWorkspaces({
        workspaces: [workspace],
      })
      .build();

    const component = renderComponent(
      store,
      currentStep,
      workspaceName,
      workspaceId,
      hasError,
      workspace.status as WorkspaceStatus,
    );

    expect(component.toJSON()).toMatchSnapshot();
  });

  it('should render START_WORKSPACE step correctly', () => {
    const currentStep = LoadIdeSteps.START_WORKSPACE;

    const workspace = createFakeCheWorkspace(
      workspaceId,
      workspaceName,
      undefined,
      WorkspaceStatus.STARTING,
    );
    const store = new FakeStoreBuilder()
      .withCheWorkspaces({
        workspaces: [workspace],
      })
      .build();

    const component = renderComponent(
      store,
      currentStep,
      workspaceName,
      workspaceId,
      false,
      workspace.status as WorkspaceStatus,
    );

    expect(component.toJSON()).toMatchSnapshot();
  });

  it('should render START_WORKSPACE step with an error correctly', () => {
    const currentStep = LoadIdeSteps.START_WORKSPACE;

    const workspace = createFakeCheWorkspace(workspaceId, workspaceName);
    const store = new FakeStoreBuilder()
      .withCheWorkspaces({
        workspaces: [workspace],
      })
      .build();

    const component = renderComponent(
      store,
      currentStep,
      workspaceName,
      workspaceId,
      true,
      WorkspaceStatus.ERROR,
    );

    expect(component.toJSON()).toMatchSnapshot();
  });

  it('should render OPEN_IDE step correctly', () => {
    const currentStep = LoadIdeSteps.OPEN_IDE;

    const runtime: che.WorkspaceRuntime = {
      machines: {},
      status: WorkspaceStatus.RUNNING,
      activeEnv: 'default',
    };
    const workspace = createFakeCheWorkspace(
      workspaceId,
      workspaceName,
      undefined,
      WorkspaceStatus.RUNNING,
      runtime,
    );
    const store = new FakeStoreBuilder()
      .withCheWorkspaces({
        workspaces: [workspace],
      })
      .build();

    const component = renderComponent(
      store,
      currentStep,
      workspaceName,
      workspaceId,
      false,
      workspace.status as WorkspaceStatus,
    );

    expect(component.toJSON()).toMatchSnapshot();
  });

  it('should render OPEN_IDE step with an error correctly', () => {
    const currentStep = LoadIdeSteps.OPEN_IDE;

    const workspace = createFakeCheWorkspace(workspaceId, workspaceName);
    const store = new FakeStoreBuilder()
      .withCheWorkspaces({
        workspaces: [workspace],
      })
      .build();
    const component = renderComponent(
      store,
      currentStep,
      workspaceName,
      workspaceId,
      true,
      WorkspaceStatus.ERROR,
    );

    expect(component.toJSON()).toMatchSnapshot();
  });

  it('should render Open IDE in the iframe correctly', () => {
    const currentStep = LoadIdeSteps.OPEN_IDE;
    const ideUrl = 'https://server-test-4400.192.168.99.100.nip.io';

    const runtime: che.WorkspaceRuntime = {
      machines: {},
      status: WorkspaceStatus.RUNNING,
      activeEnv: 'default',
    };
    const workspace = createFakeCheWorkspace(
      workspaceId,
      workspaceName,
      undefined,
      WorkspaceStatus.RUNNING,
      runtime,
    );
    const store = new FakeStoreBuilder()
      .withCheWorkspaces({
        workspaces: [workspace],
      })
      .build();
    const component = renderComponent(
      store,
      currentStep,
      workspaceName,
      workspaceId,
      false,
      workspace.status as WorkspaceStatus,
      ideUrl,
    );

    expect(component.toJSON()).toMatchSnapshot();
  });
});

function renderComponent(
  store: Store,
  currentStep: LoadIdeSteps,
  workspaceName: string,
  workspaceId: string,
  hasError: boolean,
  workspaceStatus: WorkspaceStatus | DeprecatedWorkspaceStatus,
  ideUrl?: string,
): ReactTestRenderer {
  return renderer.create(
    <Provider store={store}>
      <IdeLoaderTabs
        currentStep={currentStep}
        workspaceName={workspaceName}
        workspaceId={workspaceId}
        hasError={hasError}
        status={workspaceStatus}
        ideUrl={ideUrl}
        isDevWorkspace={false}
      />
    </Provider>,
  );
}
