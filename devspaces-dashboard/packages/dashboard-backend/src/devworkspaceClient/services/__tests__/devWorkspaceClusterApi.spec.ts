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

import { V1alpha2DevWorkspace } from '@devfile/api';
import { devworkspaceGroup, devworkspaceLatestVersion, devworkspacePlural } from '@devfile/api/api';
import * as mockClient from '@kubernetes/client-node';
import { CustomObjectsApi } from '@kubernetes/client-node';

import {
  CheClusterCustomResource,
  CustomResourceDefinitionList,
  IDevWorkspaceClusterApi,
} from '@/devworkspaceClient';
import { DevWorkspaceClusterApiService } from '@/devworkspaceClient/services/devWorkspaceClusterApiService';
import { logger } from '@/utils/logger';

jest.mock('@/devworkspaceClient/services/helpers/prepareCustomObjectWatch');

describe('DevWorkspace Cluster API Service', () => {
  let devWorkspaceClusterApiService: IDevWorkspaceClusterApi;
  let cheClusterCustomResourcesList: { body: CustomResourceDefinitionList };

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      CHECLUSTER_CR_NAME: 'eclipse-che',
      CHECLUSTER_CR_NAMESPACE: 'eclipse-che',
    };

    const { KubeConfig } = mockClient;
    const kubeConfig = new KubeConfig();

    kubeConfig.makeApiClient = jest.fn().mockImplementation(() => {
      return {
        listClusterCustomObject: () => Promise.resolve(cheClusterCustomResourcesList),
      } as unknown as CustomObjectsApi;
    });

    devWorkspaceClusterApiService = new DevWorkspaceClusterApiService(kubeConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('Running workspace cluster limit exceeded, limit 2', async () => {
    cheClusterCustomResourcesList = buildCheClusterCustomResourceList(2);
    const runningDW1 = getDWObject('devworkspace1', 'Running');
    const runningDW2 = getDWObject('devworkspace2', 'Running');
    (devWorkspaceClusterApiService as any).handleWatchMessage('ADDED', runningDW1);
    (devWorkspaceClusterApiService as any).handleWatchMessage('ADDED', runningDW2);

    const res = await devWorkspaceClusterApiService.isRunningWorkspacesClusterLimitExceeded();

    expect(res).toBeTruthy();
  });

  test('Running workspace cluster limit NOT exceeded, limit 2', async () => {
    cheClusterCustomResourcesList = buildCheClusterCustomResourceList(2);
    const runningDW1 = getDWObject('devworkspace1', 'Running');
    (devWorkspaceClusterApiService as any).handleWatchMessage('ADDED', runningDW1);

    const res = await devWorkspaceClusterApiService.isRunningWorkspacesClusterLimitExceeded();

    expect(res).toBeFalsy();
  });

  test('Running workspace cluster limit NOT exceeded, limit -1', async () => {
    cheClusterCustomResourcesList = buildCheClusterCustomResourceList(-1);
    const runningDW1 = getDWObject('devworkspace1', 'Running');
    const runningDW2 = getDWObject('devworkspace2', 'Running');
    (devWorkspaceClusterApiService as any).handleWatchMessage('ADDED', runningDW1);
    (devWorkspaceClusterApiService as any).handleWatchMessage('ADDED', runningDW2);

    const res = await devWorkspaceClusterApiService.isRunningWorkspacesClusterLimitExceeded();

    expect(res).toBeFalsy();
  });

  test('Running workspace cluster limit NOT exceeded, limit undefined', async () => {
    cheClusterCustomResourcesList = buildCheClusterCustomResourceList(undefined);
    const runningDW1 = getDWObject('devworkspace1', 'Running');
    (devWorkspaceClusterApiService as any).handleWatchMessage('ADDED', runningDW1);

    const res = await devWorkspaceClusterApiService.isRunningWorkspacesClusterLimitExceeded();

    expect(res).toBeFalsy();
  });

  it('ADDED event, DW no phase, do not increase NofRDW', async () => {
    const dwObject = getDWObject('devworkspace1', undefined);
    (devWorkspaceClusterApiService as any).handleWatchMessage('ADDED', dwObject);

    expect((devWorkspaceClusterApiService as any).getNumberOfRunningWorkspaces()).toEqual(0);
  });

  it('MODIFIED event, DW no phase, do not increase NofRDW', async () => {
    const dwObject = getDWObject('devworkspace1', undefined);
    (devWorkspaceClusterApiService as any).handleWatchMessage('ADDED', dwObject);

    expect((devWorkspaceClusterApiService as any).getNumberOfRunningWorkspaces()).toEqual(0);
  });

  it('ADDED event, increase NofRDW by 1', async () => {
    const runningDW1 = getDWObject('devworkspace1', 'Running');
    (devWorkspaceClusterApiService as any).handleWatchMessage('ADDED', runningDW1);

    expect((devWorkspaceClusterApiService as any).getNumberOfRunningWorkspaces()).toEqual(1);
  });

  it('MODIFIED event, increase NofRDW by 1', async () => {
    const runningDW1 = getDWObject('devworkspace1', 'Running');
    (devWorkspaceClusterApiService as any).handleWatchMessage('MODIFIED', runningDW1);

    expect((devWorkspaceClusterApiService as any).getNumberOfRunningWorkspaces()).toEqual(1);
  });

  it('ADDED events, different Ids, increase NofRDW by 2', async () => {
    const runningDW1 = getDWObject('devworkspace1', 'Running');
    const runningDW2 = getDWObject('devworkspace2', 'Running');
    (devWorkspaceClusterApiService as any).handleWatchMessage('ADDED', runningDW1);
    (devWorkspaceClusterApiService as any).handleWatchMessage('ADDED', runningDW2);

    expect((devWorkspaceClusterApiService as any).getNumberOfRunningWorkspaces()).toEqual(2);
  });

  it('ADDED events, same Ids, increase NofRDW by 1', async () => {
    const runningDW1 = getDWObject('devworkspace1', 'Running');
    (devWorkspaceClusterApiService as any).handleWatchMessage('ADDED', runningDW1);
    (devWorkspaceClusterApiService as any).handleWatchMessage('ADDED', runningDW1);

    expect((devWorkspaceClusterApiService as any).getNumberOfRunningWorkspaces()).toEqual(1);
  });

  it('MODIFIED events, different Ids, increase NofRDW by 2', async () => {
    const runningDW1 = getDWObject('devworkspace1', 'Running');
    const runningDW2 = getDWObject('devworkspace2', 'Running');
    (devWorkspaceClusterApiService as any).handleWatchMessage('MODIFIED', runningDW1);
    (devWorkspaceClusterApiService as any).handleWatchMessage('MODIFIED', runningDW2);

    expect((devWorkspaceClusterApiService as any).getNumberOfRunningWorkspaces()).toEqual(2);
  });

  it('MODIFIED events, same Ids, increase NofRDW by 1', async () => {
    const runningDW1 = getDWObject('devworkspace1', 'Running');
    (devWorkspaceClusterApiService as any).handleWatchMessage('MODIFIED', runningDW1);

    expect((devWorkspaceClusterApiService as any).getNumberOfRunningWorkspaces()).toEqual(1);
  });

  it('ADDED and MODIFIED events, different Ids, increase NofRDW by 2', async () => {
    const runningDW1 = getDWObject('devworkspace1', 'Running');
    const runningDW2 = getDWObject('devworkspace2', 'Running');
    (devWorkspaceClusterApiService as any).handleWatchMessage('ADDED', runningDW1);
    (devWorkspaceClusterApiService as any).handleWatchMessage('MODIFIED', runningDW2);

    expect((devWorkspaceClusterApiService as any).getNumberOfRunningWorkspaces()).toEqual(2);
  });

  it('ADDED and MODIFIED events, same Ids, increase NofRDW by 1', async () => {
    const runningDW1 = getDWObject('devworkspace1', 'Running');
    (devWorkspaceClusterApiService as any).handleWatchMessage('ADDED', runningDW1);
    (devWorkspaceClusterApiService as any).handleWatchMessage('MODIFIED', runningDW1);

    expect((devWorkspaceClusterApiService as any).getNumberOfRunningWorkspaces()).toEqual(1);
  });

  it('ADDED and DELETED events, same Ids, do not increase NofRDW', async () => {
    const runningDW1 = getDWObject('devworkspace1', 'Running');
    (devWorkspaceClusterApiService as any).handleWatchMessage('ADDED', runningDW1);
    (devWorkspaceClusterApiService as any).handleWatchMessage('DELETED', runningDW1);

    expect((devWorkspaceClusterApiService as any).getNumberOfRunningWorkspaces()).toEqual(0);
  });

  it('MODIFIED and DELETED events, same Ids, do not increase NofRDW', async () => {
    const runningDW1 = getDWObject('devworkspace1', 'Running');
    (devWorkspaceClusterApiService as any).handleWatchMessage('MODIFIED', runningDW1);
    (devWorkspaceClusterApiService as any).handleWatchMessage('DELETED', runningDW1);

    expect((devWorkspaceClusterApiService as any).getNumberOfRunningWorkspaces()).toEqual(0);
  });

  it('MODIFIED events, same Ids, do not increase NofRDW if workspace not running/starting', async () => {
    const runningDW1 = getDWObject('devworkspace1', 'Running');
    const stoppingDW2 = getDWObject('devworkspace1', 'Stopping');
    (devWorkspaceClusterApiService as any).handleWatchMessage('MODIFIED', runningDW1);
    (devWorkspaceClusterApiService as any).handleWatchMessage('MODIFIED', stoppingDW2);

    expect((devWorkspaceClusterApiService as any).getNumberOfRunningWorkspaces()).toEqual(0);
  });

  it('should handle the watch messages of ERROR phase', async () => {
    (devWorkspaceClusterApiService as any).handleWatchMessage('ERROR', {
      message: 'error message',
    });

    expect(logger.info).toHaveBeenCalledWith('Watching DevWorkspace ERROR phase: error message');
  });

  it('should handle the watch error', async () => {
    const path = `/apis/${devworkspaceGroup}/${devworkspaceLatestVersion}/watch/${devworkspacePlural}`;
    const error = new Error('watch error');

    (devWorkspaceClusterApiService as any).handleWatchError(error, path);
    expect(logger.warn).toHaveBeenCalledWith(error, `Stopped watching ${path}.`);
  });

  it('should watch events', async () => {
    const spyWatch = jest.spyOn((devWorkspaceClusterApiService as any).customObjectWatch, 'watch');

    await (devWorkspaceClusterApiService as any).watchInAllNamespaces();

    expect(spyWatch).toHaveBeenCalledWith(
      `/apis/${devworkspaceGroup}/${devworkspaceLatestVersion}/watch/${devworkspacePlural}`,
      { watch: true },
      expect.any(Function),
      expect.any(Function),
    );

    await (devWorkspaceClusterApiService as any).watchInAllNamespaces();

    expect(spyWatch).toHaveBeenCalledTimes(1);
  });
});

function buildCheClusterCustomResourceList(maxNumberOfRunningWorkspacesPerCluster?: number): {
  body: CustomResourceDefinitionList;
} {
  return {
    body: {
      apiVersion: 'org.eclipse.che/v2',
      items: [
        {
          apiVersion: 'org.eclipse.che/v2',
          kind: 'CheCluster',
          metadata: {
            name: 'eclipse-che',
            namespace: 'eclipse-che',
          },
          spec: {
            devEnvironments: {
              maxNumberOfRunningWorkspacesPerCluster,
            },
          },
        } as CheClusterCustomResource,
      ],
      kind: 'CheClusterList',
    },
  };
}

function getDWObject(devworkspaceId: string, phase?: string): V1alpha2DevWorkspace {
  return {
    apiVersion: 'workspace.devfile.io/v1alpha2',
    kind: 'DevWorkspace',
    status: {
      devworkspaceId,
      phase,
    },
  };
}
