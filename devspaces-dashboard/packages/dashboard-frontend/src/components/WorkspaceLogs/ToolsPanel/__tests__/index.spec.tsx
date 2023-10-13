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

import getComponentRenderer from '@/services/__mocks__/getComponentRenderer';

import { WorkspaceLogsToolsPanel } from '..';

const { createSnapshot } = getComponentRenderer(getComponent);

describe('The LogsTools component', () => {
  test('snapshot with left part only', () => {
    expect(createSnapshot(<div>left</div>, undefined, false)).toMatchSnapshot();
  });

  test('snapshot with right part only', () => {
    expect(createSnapshot(undefined, <div>right</div>, false)).toMatchSnapshot();
  });

  test('snapshot with both parts present', () => {
    expect(createSnapshot(<div>left</div>, <div>right</div>, false)).toMatchSnapshot();
  });

  test('snapshot in expanded state', () => {
    expect(createSnapshot(<div>left</div>, <div>right</div>, true)).toMatchSnapshot();
  });
});

function getComponent(
  leftPart: React.ReactNode | undefined,
  rightPart: React.ReactNode | undefined,
  isExpanded: boolean,
): React.ReactElement {
  return (
    <WorkspaceLogsToolsPanel leftPart={leftPart} rightPart={rightPart} isExpanded={isExpanded} />
  );
}
