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

import React from 'react';
import { Provider } from 'react-redux';

import { NavigationRecentItemObject } from '@/Layout/Navigation';
import { RecentItemWorkspaceActions } from '@/Layout/Navigation/RecentItem/WorkspaceActions';
import getComponentRenderer from '@/services/__mocks__/getComponentRenderer';
import { constructWorkspace } from '@/services/workspace-adapter';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

jest.mock('@/contexts/WorkspaceActions/Dropdown');

const { createSnapshot } = getComponentRenderer(getComponent);

describe('RecentItemWorkspaceActions', () => {
  test('snapshot', () => {
    const workspace = constructWorkspace(
      new DevWorkspaceBuilder()
        .withName('my-workspace')
        .withUID('1234')
        .withStatus({ phase: 'STOPPED' })
        .build(),
    );

    const snapshot = createSnapshot({
      label: 'my-workspace',
      to: '/namespace/my-workspace',
      workspace,
    });
    expect(snapshot).toMatchSnapshot();
  });
});

function getComponent(item: NavigationRecentItemObject): React.ReactElement {
  const store = new FakeStoreBuilder().build();
  return (
    <Provider store={store}>
      <RecentItemWorkspaceActions item={item} />
    </Provider>
  );
}
