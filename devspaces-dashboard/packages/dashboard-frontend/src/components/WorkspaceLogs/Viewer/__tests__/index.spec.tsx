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
import { WorkspaceLogsViewer } from '..';
import getComponentRenderer from '../../../../services/__mocks__/getComponentRenderer';
import { ContainerLogs } from '../../../../store/Pods/Logs';

const { createSnapshot } = getComponentRenderer(getComponent);

describe('WorkspaceLogsViewer', () => {
  test('snapshot expanded viewer', () => {
    const logsData: ContainerLogs = {
      logs: 'logs line 1\nlogs line 2',
      failure: false,
    };
    expect(createSnapshot(true, logsData)).toMatchSnapshot();
  });

  test('snapshot compressed viewer', () => {
    const logsData: ContainerLogs = {
      logs: 'logs line 1\nlogs line 2',
      failure: false,
    };
    expect(createSnapshot(false, logsData)).toMatchSnapshot();
  });

  test('snapshot error logs', () => {
    const logsData: ContainerLogs = {
      logs: 'error logs line',
      failure: true,
    };
    expect(createSnapshot(false, logsData)).toMatchSnapshot();
  });
});

function getComponent(
  isExpanded: boolean,
  logsData: ContainerLogs | undefined,
): React.ReactElement {
  return <WorkspaceLogsViewer isExpanded={isExpanded} logsData={logsData} />;
}
