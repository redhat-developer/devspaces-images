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

import { CoreV1Event } from '@kubernetes/client-node';
import { screen, within } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import WorkspaceEvents from '..';
import devfileApi from '../../../services/devfileApi';
import {
  constructWorkspace,
  Workspace,
  WorkspaceAdapter,
} from '../../../services/workspace-adapter';
import getComponentRenderer from '../../../services/__mocks__/getComponentRenderer';
import { DevWorkspaceBuilder } from '../../../store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';

jest.mock('../Item');

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

describe('The WorkspaceEvents component', () => {
  const devworkspaceId = 'devWorkspace';
  const podName = devworkspaceId + '-pod';

  let devWorkspaceBuilder: DevWorkspaceBuilder;
  let event1: CoreV1Event;
  let event2: CoreV1Event;

  beforeEach(() => {
    event1 = {
      lastTimestamp: '2021-03-31T14:00:00Z' as unknown as Date,
      message: 'message 1',
      involvedObject: {
        kind: 'Pod',
        name: podName,
      },
      metadata: {
        resourceVersion: '1',
      },
    };
    event2 = {
      lastTimestamp: '2021-03-31T14:01:00Z' as unknown as Date,
      message: 'message 2',
      involvedObject: {
        kind: 'Pod',
        name: podName,
      },
      metadata: {
        resourceVersion: '2',
      },
    };

    devWorkspaceBuilder = new DevWorkspaceBuilder()
      .withId(devworkspaceId)
      .withName('my-project')
      .withNamespace('user-che')
      .withStatus({ phase: 'STOPPED' });

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  test('snapshot - empty state', () => {
    const store = new FakeStoreBuilder().withDevWorkspaces({ workspaces: [] }).build();
    const snapshot = createSnapshot(store, undefined);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('snapshot - no events', () => {
    const devWorkspace = devWorkspaceBuilder.withStatus({ phase: 'STARTING' }).build();
    const store = new FakeStoreBuilder().withDevWorkspaces({ workspaces: [devWorkspace] }).build();
    const component = createSnapshot(store, devWorkspace);
    expect(component.toJSON()).toMatchSnapshot();
  });

  test('snapshot - with events', () => {
    const devWorkspace = devWorkspaceBuilder.withStatus({ phase: 'STARTING' }).build();
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [devWorkspace],
        startedWorkspaces: { [WorkspaceAdapter.getUID(devWorkspace)]: '1' },
      })
      .withEvents({ events: [event1, event2] })
      .build();
    const component = createSnapshot(store, devWorkspace);
    expect(component.toJSON()).toMatchSnapshot();
  });

  it('should show a correct number of events', () => {
    const devWorkspace = devWorkspaceBuilder.withStatus({ phase: 'STARTING' }).build();
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [devWorkspace],
        startedWorkspaces: { [WorkspaceAdapter.getUID(devWorkspace)]: '1' },
      })
      .withEvents({ events: [event1] })
      .build();
    const { reRenderComponent } = renderComponent(store, devWorkspace);

    expect(screen.getByText('1 event')).toBeTruthy();
    expect(screen.getAllByTestId('event-item').length).toEqual(1);

    const nextStore = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [devWorkspace],
        startedWorkspaces: { [WorkspaceAdapter.getUID(devWorkspace)]: '1' },
      })
      .withEvents({ events: [event1, event2] })
      .build();
    reRenderComponent(nextStore, devWorkspace);

    expect(screen.getByText('2 events')).toBeTruthy();
    expect(screen.getAllByTestId('event-item').length).toEqual(2);
  });

  it('should sort events by timestamp', () => {
    const devWorkspace = devWorkspaceBuilder.withStatus({ phase: 'STARTING' }).build();
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [devWorkspace],
        startedWorkspaces: { [WorkspaceAdapter.getUID(devWorkspace)]: '1' },
      })
      .withEvents({ events: [event1, event2] })
      .build();
    renderComponent(store, devWorkspace);

    const eventItems = screen.getAllByTestId('event-item');
    expect(within(eventItems[0]).getByText('message 2')).toBeTruthy();
    expect(within(eventItems[1]).getByText('message 1')).toBeTruthy();
  });

  it('should not sort', () => {
    // events don't have time labels
    event1.lastTimestamp = undefined;
    event2.lastTimestamp = undefined;

    const devWorkspace = devWorkspaceBuilder.withStatus({ phase: 'STARTING' }).build();
    const store = new FakeStoreBuilder()
      .withDevWorkspaces({
        workspaces: [devWorkspace],
        startedWorkspaces: { [WorkspaceAdapter.getUID(devWorkspace)]: '1' },
      })
      .withEvents({ events: [event1, event2] })
      .build();
    renderComponent(store, devWorkspace);

    const eventItems = screen.getAllByTestId('event-item');
    expect(within(eventItems[0]).getByText('message 1')).toBeTruthy();
    expect(within(eventItems[1]).getByText('message 2')).toBeTruthy();
  });
});

function getComponent(
  store: Store,
  devWorkspace: devfileApi.DevWorkspace | undefined,
): React.ReactElement {
  let workspace: Workspace | undefined;
  if (devWorkspace !== undefined) {
    workspace = constructWorkspace(devWorkspace);
  }
  return (
    <Provider store={store}>
      <WorkspaceEvents workspaceUID={workspace?.uid} />
    </Provider>
  );
}
