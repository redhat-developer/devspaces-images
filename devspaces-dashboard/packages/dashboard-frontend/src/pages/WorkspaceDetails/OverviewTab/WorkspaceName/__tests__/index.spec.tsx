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

import { ApplicationId } from '@eclipse-che/common';
import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import WorkspaceNameLink from '@/pages/WorkspaceDetails/OverviewTab/WorkspaceName';
import getComponentRenderer from '@/services/__mocks__/getComponentRenderer';
import devfileApi from '@/services/devfileApi';
import { constructWorkspace, Workspace } from '@/services/workspace-adapter';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

const { createSnapshot } = getComponentRenderer(getComponent);

describe('WorkspaceNameLink', () => {
  let storeBuilder: FakeStoreBuilder;
  let devWorkspace: devfileApi.DevWorkspace;
  let workspace: Workspace;

  beforeEach(() => {
    devWorkspace = new DevWorkspaceBuilder().withName('my-project').build();
    workspace = constructWorkspace(devWorkspace);
    storeBuilder = new FakeStoreBuilder().withDevWorkspaces({ workspaces: [devWorkspace] });
  });

  test('screenshot when cluster console is available', () => {
    const store = storeBuilder
      .withClusterInfo({
        applications: [
          {
            id: ApplicationId.CLUSTER_CONSOLE,
            title: 'Cluster Console',
            url: 'https://console-openshift-console.apps-crc.testing',
            icon: 'icon',
          },
        ],
      })
      .build();
    const snapshot = createSnapshot(store, workspace);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('screenshot when cluster console is NOT available', () => {
    const store = storeBuilder.build();
    const snapshot = createSnapshot(store, workspace);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });
});

function getComponent(store: Store, workspace: Workspace) {
  return (
    <Provider store={store}>
      <WorkspaceNameLink workspace={workspace} />
    </Provider>
  );
}
