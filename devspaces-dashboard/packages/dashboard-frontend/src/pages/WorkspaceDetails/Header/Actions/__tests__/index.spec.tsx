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

import getComponentRenderer from '@/services/__mocks__/getComponentRenderer';
import { constructWorkspace, Workspace } from '@/services/workspace-adapter';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';

import { WorkspaceDetailsHeaderActions } from '..';

jest.mock('@/contexts/WorkspaceActions/Dropdown');

const { createSnapshot } = getComponentRenderer(getComponent);

describe('WorkspaceDetailsHeaderActions', () => {
  test('snapshot', () => {
    const workspace = constructWorkspace(
      new DevWorkspaceBuilder()
        .withName('workspace')
        .withUID('test-wksp-id')
        .withStatus({ phase: 'STOPPED' })
        .build(),
    );
    const snapshot = createSnapshot(workspace);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });
});

function getComponent(workspace: Workspace): React.ReactElement {
  return <WorkspaceDetailsHeaderActions workspace={workspace} />;
}
