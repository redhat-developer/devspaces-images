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

import { getStartWorkspaceConditions } from '@/components/WorkspaceProgress/utils';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';

describe('WorkspaceProgress utils', () => {
  beforeEach(() => {});

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStartWorkspaceCondition', () => {
    it('should return an empty array as a default value', () => {
      const devWorkspace = new DevWorkspaceBuilder().build();

      expect(devWorkspace.status?.conditions).toBeUndefined();

      const conditions = getStartWorkspaceConditions(devWorkspace);

      expect(conditions).toEqual([]);
    });
    it('should return conditions from the devWorkspace', () => {
      const status = {
        conditions: [
          {
            type: 'Stopped',
            status: 'False',
            reason: 'LimitReached',
            message: 'Workspace stopped due to error.',
          },
        ],
      };
      const devWorkspace = new DevWorkspaceBuilder().withStatus(status).build();

      const conditions = getStartWorkspaceConditions(devWorkspace);

      expect(conditions).toEqual(status.conditions);
    });
  });
  it('should filter conditions that are not related to the workspace start', () => {
    const status = {
      conditions: [
        {
          message: 'DevWorkspace is starting',
          status: 'True',
          type: 'Started',
        },
        {
          message: 'Resolved plugins and parents from DevWorkspace',
          status: 'True',
          type: 'DevWorkspaceResolved',
        },
        {
          message: 'Storage ready',
          status: 'True',
          type: 'StorageReady',
        },
        {
          message: 'Networking ready',
          status: 'True',
          type: 'RoutingReady',
        },
        {
          message: 'DevWorkspace serviceaccount ready',
          status: 'True',
          type: 'ServiceAccountReady',
        },
        {
          message: 'Waiting for workspace deployment',
          status: 'False',
          type: 'DeploymentReady',
        },
      ],
    };
    const devWorkspace = new DevWorkspaceBuilder().withStatus(status).build();

    const conditions = getStartWorkspaceConditions(devWorkspace);

    expect(conditions).not.toEqual(status.conditions);
    expect(conditions).toEqual([
      {
        message: 'DevWorkspace is starting',
        status: 'True',
        type: 'Started',
      },
      {
        message: 'Resolved plugins and parents from DevWorkspace',
        status: 'True',
        type: 'DevWorkspaceResolved',
      },
      {
        message: 'Storage ready',
        status: 'True',
        type: 'StorageReady',
      },
      {
        message: 'Networking ready',
        status: 'True',
        type: 'RoutingReady',
      },
      {
        message: 'DevWorkspace serviceaccount ready',
        status: 'True',
        type: 'ServiceAccountReady',
      },
    ]);
  });
});
