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

import { screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import WorkspaceLogs from '..';
import { constructWorkspace } from '../../../services/workspace-adapter';
import getComponentRenderer from '../../../services/__mocks__/getComponentRenderer';
import { DevWorkspaceBuilder } from '../../../store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';

jest.mock('../../../services/helpers/tools', () => {
  return {
    getBlobUrl: () => 'https://fake.blob.url',
  };
});

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

describe('The LogsTab component', () => {
  const workspaceId = 'workspace-test-id';

  let devWorkspaceBuilder: DevWorkspaceBuilder;

  beforeEach(() => {
    devWorkspaceBuilder = new DevWorkspaceBuilder().withId(workspaceId);
  });

  test('snapshot - empty state', () => {
    const devWorkspace = devWorkspaceBuilder.withStatus({ phase: 'STOPPED' }).build();
    const workspace = constructWorkspace(devWorkspace);
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [devWorkspace],
      })
      .build();

    const component = createSnapshot(store, workspace.uid);

    expect(component.toJSON()).toMatchSnapshot();
  });

  test('snapshot - no logs', () => {
    const devWorkspace = devWorkspaceBuilder.withStatus({ phase: 'STARTING' }).build();
    const workspace = constructWorkspace(devWorkspace);

    const store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [devWorkspace],
      })
      .build();

    const component = createSnapshot(store, workspace.uid);

    expect(component.toJSON()).toMatchSnapshot();
  });

  test('snapshot - with logs', () => {
    const devWorkspace = new DevWorkspaceBuilder()
      .withId(workspaceId)
      .withStatus({
        phase: 'STARTING',
        conditions: [
          {
            status: 'True',
            type: 'Ready',
            message: 'Message line 1',
          },
          {
            status: 'True',
            type: 'Ready',
            message: 'Message line 2',
          },
          {
            status: 'True',
            type: 'Ready',
            message: '1 error occurred: Message line 3',
          },
        ],
      })
      .build();
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [devWorkspace],
      })
      .build();

    const component = createSnapshot(store, constructWorkspace(devWorkspace).uid);

    expect(component.toJSON()).toMatchSnapshot();
  });

  it('should show a correct number of lines', async () => {
    const devWorkspace = new DevWorkspaceBuilder()
      .withId(workspaceId)
      .withStatus({
        phase: 'STARTING',
        conditions: [
          {
            status: 'True',
            type: 'Ready',
            message: 'Message line 1',
          },
          {
            status: 'True',
            type: 'Ready',
            message: 'Message line 2',
          },
        ],
      })
      .build();
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [devWorkspace],
      })
      .build();

    const { reRenderComponent } = renderComponent(store, constructWorkspace(devWorkspace).uid);

    expect(screen.queryAllByTestId('workspace-logs-line').length).toBe(2);

    const nextDevWorkspace = new DevWorkspaceBuilder()
      .withId(workspaceId)
      .withStatus({
        phase: 'STARTING',
        conditions: [
          {
            status: 'True',
            type: 'Ready',
            message: 'Message line 1',
          },
          {
            status: 'True',
            type: 'Ready',
            message: 'Message line 2',
          },
          {
            status: 'True',
            type: 'Ready',
            message: '1 error occurred: Message line 3',
          },
        ],
      })
      .build();
    const nextStore = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [nextDevWorkspace],
      })
      .build();

    reRenderComponent(nextStore, constructWorkspace(nextDevWorkspace).uid);

    expect(screen.queryAllByTestId('workspace-logs-line').length).toBe(3);
  });
});

function getComponent(store: Store, workspaceUID: string): React.ReactElement {
  return (
    <Provider store={store}>
      <WorkspaceLogs workspaceUID={workspaceUID} />
    </Provider>
  );
}
