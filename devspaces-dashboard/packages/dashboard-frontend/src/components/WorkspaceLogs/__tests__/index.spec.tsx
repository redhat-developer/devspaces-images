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

import { V1Pod } from '@kubernetes/client-node';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider } from 'react-redux';
import { Action, Store } from 'redux';

import getComponentRenderer from '@/services/__mocks__/getComponentRenderer';
import devfileApi from '@/services/devfileApi';
import { constructWorkspace, Workspace } from '@/services/workspace-adapter';
import { AppThunk } from '@/store';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { ActionCreators, State } from '@/store/Pods/Logs';

import WorkspaceLogs from '..';

jest.mock('../ContainerSelector');
jest.mock('../ViewerTools');
jest.mock('../Viewer');

const mockWatchPodLogs = jest.fn();
const mockStopWatchingPodLogs = jest.fn();
jest.mock('../../../store/Pods/Logs', () => ({
  actionCreators: {
    watchPodLogs:
      (pod: V1Pod): AppThunk<Action, Promise<void>> =>
      async (): Promise<void> =>
        mockWatchPodLogs(pod),
    stopWatchingPodLogs:
      (pod: V1Pod): AppThunk<Action, Promise<void>> =>
      async (): Promise<void> =>
        mockStopWatchingPodLogs(pod),
  } as ActionCreators,
}));

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

describe('The WorkspaceLogs component', () => {
  const workspaceId = 'workspace-test-id';
  const podName = workspaceId + '-pod';
  const namespace = 'user-che';

  let devWorkspace: devfileApi.DevWorkspace;
  let workspace: Workspace;
  let pod: V1Pod;
  let logs: State['logs'];

  let devWorkspaceBuilder = new DevWorkspaceBuilder().withId(workspaceId);

  beforeEach(() => {
    devWorkspace = devWorkspaceBuilder
      .withStatus({ phase: 'STARTING' })
      .withName('dev-wksp')
      .build();
    workspace = constructWorkspace(devWorkspace);

    pod = {
      metadata: {
        name: podName,
        namespace,
      },
      spec: {
        containers: [{ name: 'container-1' }, { name: 'container-2' }],
      },
    } as V1Pod;

    logs = {
      [podName]: {
        containers: {
          'container-1': {
            logs: 'first line\nsecond line\nthird line',
            failure: false,
          },
          'container-2': {
            logs: 'waiting for container to be ready...',
            failure: true,
          },
        },
      },
    };

    devWorkspaceBuilder = new DevWorkspaceBuilder().withId(workspaceId);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot - empty state', () => {
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [devWorkspace],
      })
      .build();

    const component = createSnapshot(store, workspace.uid);

    expect(component.toJSON()).toMatchSnapshot();
  });

  test('snapshot - with logs', () => {
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [devWorkspace],
      })
      .withPods({
        pods: [pod],
      })
      .withLogs(logs)
      .build();

    const component = createSnapshot(store, constructWorkspace(devWorkspace).uid);

    expect(component.toJSON()).toMatchSnapshot();
  });

  describe('start watching logs', () => {
    it('should call `watchPodLogs`', async () => {
      /* no pods to watch */

      const store = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [devWorkspace],
        })
        .build();

      const { reRenderComponent } = renderComponent(store, workspace.uid);

      expect(mockWatchPodLogs).not.toHaveBeenCalled();
      expect(mockStopWatchingPodLogs).not.toHaveBeenCalled();

      /* pod added in the store */

      const nextStore = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [devWorkspace],
        })
        .withPods({
          pods: [pod],
        })
        .build();

      reRenderComponent(nextStore, workspace.uid);

      expect(mockWatchPodLogs).toHaveBeenCalledWith(pod);
      expect(mockWatchPodLogs).toHaveBeenCalledTimes(1);
      expect(mockStopWatchingPodLogs).not.toHaveBeenCalled();
    });

    it('should show logs viewer component', async () => {
      /* no pods to watch */

      const store = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [devWorkspace],
        })
        .build();

      const { reRenderComponent } = renderComponent(store, workspace.uid);

      expect(screen.queryByTestId('workspace-logs-viewer')).not.toBeTruthy();

      /* pod added in the store */

      const nextStore = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [devWorkspace],
        })
        .withPods({
          pods: [pod],
        })
        .build();

      reRenderComponent(nextStore, workspace.uid);

      expect(screen.queryByTestId('workspace-logs-viewer')).toBeTruthy();
    });

    it('should show logs', async () => {
      /* pod but no logs in store */

      const store = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [devWorkspace],
        })
        .withPods({
          pods: [pod],
        })
        .build();

      const { reRenderComponent } = renderComponent(store, workspace.uid);

      const logsViewer = screen.getByTestId('workspace-logs-viewer');

      expect(within(logsViewer).queryByText(/first line/)).not.toBeTruthy();

      /* logs added in the store */

      const nextStore = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [devWorkspace],
        })
        .withPods({
          pods: [pod],
        })
        .withLogs(logs)
        .build();

      reRenderComponent(nextStore, workspace.uid);

      expect(within(logsViewer).queryByText(/first line/)).toBeTruthy();
    });

    it('should stop and then start watching logs', async () => {
      /* pod in store */

      const store = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [devWorkspace],
        })
        .withPods({
          pods: [pod],
        })
        .build();

      const { reRenderComponent } = renderComponent(store, workspace.uid);

      /* no pods in store */

      const nextStore = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [devWorkspace],
        })
        .build();

      jest.clearAllMocks();
      reRenderComponent(nextStore, workspace.uid);

      expect(mockWatchPodLogs).not.toHaveBeenCalledWith();
      expect(mockStopWatchingPodLogs).toHaveBeenCalled();
      expect(mockStopWatchingPodLogs).toHaveBeenCalledTimes(1);

      /* pod added in the store */

      const nextNextStore = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [devWorkspace],
        })
        .withPods({
          pods: [pod],
        })
        .build();

      jest.clearAllMocks();
      reRenderComponent(nextNextStore, workspace.uid);

      expect(mockWatchPodLogs).toHaveBeenCalledWith(pod);
      expect(mockWatchPodLogs).toHaveBeenCalledTimes(1);
      expect(mockStopWatchingPodLogs).not.toHaveBeenCalled();
    });
  });

  describe('should stop watching logs', () => {
    it('should call `stopWatchingPodLogs`', async () => {
      /* pod in store */

      const store = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [devWorkspace],
        })
        .withPods({
          pods: [pod],
        })
        .build();

      const { reRenderComponent } = renderComponent(store, workspace.uid);

      jest.clearAllMocks();

      /* no pods in store */

      const nextStore = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [devWorkspace],
        })
        .build();

      reRenderComponent(nextStore, workspace.uid);

      expect(mockWatchPodLogs).not.toHaveBeenCalledWith();
      expect(mockStopWatchingPodLogs).toHaveBeenCalled();
      expect(mockStopWatchingPodLogs).toHaveBeenCalledTimes(1);
    });

    it('should show the empty-screen component', async () => {
      /* pod in store */

      const store = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [devWorkspace],
        })
        .withPods({
          pods: [pod],
        })
        .build();

      const { reRenderComponent } = renderComponent(store, workspace.uid);

      expect(screen.queryByTestId('workspace-logs-viewer')).toBeTruthy();

      /* no pods in store */

      const nextStore = new FakeStoreBuilder()
        .withDevWorkspaces({
          workspaces: [devWorkspace],
        })
        .build();

      reRenderComponent(nextStore, workspace.uid);

      expect(screen.queryByTestId('workspace-logs-viewer')).not.toBeTruthy();
    });
  });

  test('test container selector', async () => {
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [devWorkspace],
      })
      .withPods({
        pods: [pod],
      })
      .withLogs(logs)
      .build();

    renderComponent(store, workspace.uid);

    /* test selector buttons */

    const container1 = screen.queryByRole('button', { name: /container-1/ });
    expect(container1).toBeTruthy();

    const container2 = screen.queryByRole('button', { name: /container-2/ });
    expect(container2).toBeTruthy();

    /* test viewer content */

    expect(screen.queryByText(/first line/)).toBeTruthy();

    userEvent.click(container2!);

    expect(screen.queryByText(/waiting for container/)).toBeTruthy();
  });

  test('test viewer tools', async () => {
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [devWorkspace],
      })
      .withPods({
        pods: [pod],
      })
      .withLogs(logs)
      .build();

    renderComponent(store, workspace.uid);

    const downloadButton = screen.queryByRole('button', { name: 'Download' });
    expect(downloadButton).toBeTruthy();

    const toggleButton = screen.queryByRole('button', { name: 'Toggle Expand' });
    expect(toggleButton).toBeTruthy();

    /* test viewer state */

    expect(screen.queryByText(/Collapsed view/)).toBeTruthy();

    userEvent.click(toggleButton!);

    expect(screen.queryByText(/Expanded view/)).toBeTruthy();

    /* test logs download option */

    const spyAppendChild = jest.spyOn(document.body, 'appendChild');

    userEvent.click(downloadButton!);

    const expectedDownloadAttr = 'dev-wksp-container-1.log';
    expect(spyAppendChild).toHaveBeenCalledWith(
      expect.objectContaining({ download: expectedDownloadAttr }),
    );

    const expectedHrefAttr = `data:text/plain;charset=utf-8,${encodeURIComponent(
      'first line\nsecond line\nthird line',
    )}`;
    expect(spyAppendChild).toHaveBeenCalledWith(
      expect.objectContaining({ href: expectedHrefAttr }),
    );
  });
});

function getComponent(store: Store, workspaceUID: string): React.ReactElement {
  return (
    <Provider store={store}>
      <WorkspaceLogs workspaceUID={workspaceUID} />
    </Provider>
  );
}
