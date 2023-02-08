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

import { DevWorkspaceBuilder } from '../../../store/__mocks__/devWorkspaceBuilder';
import getWorkspaceLogs from '../getWorkspaceLogs';

describe('getWorkspaceLogs', () => {
  it('should return empty array if workspace status is undefined', () => {
    const workspace = new DevWorkspaceBuilder().build();

    expect(getWorkspaceLogs(workspace)).toEqual([]);
  });

  it('should return empty array if workspace status conditions are undefined', () => {
    const workspace = new DevWorkspaceBuilder().withStatus({ phase: 'STARTING' }).build();

    expect(getWorkspaceLogs(workspace)).toEqual([]);
  });

  it('should return empty array if workspace status conditions are empty', () => {
    const workspace = new DevWorkspaceBuilder()
      .withStatus({ phase: 'STARTING', conditions: [] })
      .build();

    expect(getWorkspaceLogs(workspace)).toEqual([]);
  });

  it('should return workspace status conditions messages', () => {
    const workspace = new DevWorkspaceBuilder()
      .withStatus({
        phase: 'STARTING',
        conditions: [
          { type: 'StorageReady', status: 'Unknown' }, // should be ignored
          { type: 'Ready', status: 'True', message: 'Message 1' },
          { type: 'Ready', status: 'True', message: 'Message 2' },
          { type: 'Ready', status: 'False', message: 'Message 3' },
        ],
      })
      .build();

    expect(getWorkspaceLogs(workspace)).toEqual(['Message 1', 'Message 2', 'Message 3']);
  });
});
