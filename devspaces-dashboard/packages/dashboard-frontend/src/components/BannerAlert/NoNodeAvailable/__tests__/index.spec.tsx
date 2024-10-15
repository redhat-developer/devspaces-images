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

import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import BannerAlertNoNodeAvailable from '@/components/BannerAlert/NoNodeAvailable';
import getComponentRenderer from '@/services/__mocks__/getComponentRenderer';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';

const { renderComponent } = getComponentRenderer(getComponent);
const text =
  '"FailedScheduling" event occurred. If cluster autoscaler is enabled it might be provisioning a new node now and workspace startup will take longer than usual.';

describe('BannerAlertNoNodeAvailable component', () => {
  it('should show alert when failedScheduling event is received and hide alert when workspace has started', async () => {
    const { reRenderComponent } = renderComponent(new FakeStoreBuilder().build());

    const events = [
      {
        reason: 'FailedScheduling',
        message: 'No preemption victims found for incoming pod',
        metadata: { uid: 'uid' },
      } as any,
    ];
    const store = new FakeStoreBuilder().withEvents({ events }).build();
    reRenderComponent(store);

    await waitFor(() => expect(screen.queryAllByText(text).length).toEqual(1));
  });

  it('should hide alert when workspace has started', async () => {
    const { reRenderComponent } = renderComponent(new FakeStoreBuilder().build());

    const events = [
      {
        reason: 'FailedScheduling',
        message: 'No preemption victims found for incoming pod',
        metadata: { uid: 'uid' },
      } as any,
    ];
    const workspaces = [
      new DevWorkspaceBuilder().withStatus({ phase: 'STARTING', devworkspaceId: 'id' }).build(),
    ];
    const store = new FakeStoreBuilder()
      .withEvents({ events })
      .withDevWorkspaces({ workspaces })
      .build();
    reRenderComponent(store);

    await waitFor(() => expect(screen.queryAllByText(text).length).toEqual(1));

    const nextWorkspaces = [
      new DevWorkspaceBuilder().withStatus({ phase: 'RUNNING', devworkspaceId: 'id' }).build(),
    ];
    const nextStore = new FakeStoreBuilder()
      .withEvents({ events })
      .withDevWorkspaces({ workspaces: nextWorkspaces })
      .build();
    reRenderComponent(nextStore);

    await waitFor(() => expect(screen.queryAllByText(text).length).toEqual(0));
  });
});

function getComponent(store: Store<any, any>) {
  return (
    <Provider store={store}>
      <BannerAlertNoNodeAvailable />
    </Provider>
  );
}
