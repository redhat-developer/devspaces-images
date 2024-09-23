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

import { getWorkspaceConditions } from '@/components/WorkspaceProgress/utils';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';

describe('WorkspaceProgress utils', () => {
  beforeEach(() => {});

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getWorkspaceCondition', () => {
    it('should return an empty array as a default value', () => {
      const devWorkspace = new DevWorkspaceBuilder().build();

      expect(devWorkspace.status?.conditions).toBeUndefined();

      const conditions = getWorkspaceConditions(devWorkspace);

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

      const conditions = getWorkspaceConditions(devWorkspace);

      expect(conditions).toEqual(status.conditions);
    });
  });
  it('should return default value if one of conditions has special type that is shown when workspace start failed', () => {
    const status = {
      phase: 'Starting',
      conditions: [
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
        {
          message:
            'Error creating DevWorkspace deployment: Container tools has state ImagePullBackOff',
          reason: 'InfrastructureFailure',
          status: 'True',
          type: 'FailedStart',
        },
      ],
    };
    const devWorkspace = new DevWorkspaceBuilder().withStatus(status).build();

    const conditions = getWorkspaceConditions(devWorkspace);

    expect(conditions).toEqual([]);
  });
});
