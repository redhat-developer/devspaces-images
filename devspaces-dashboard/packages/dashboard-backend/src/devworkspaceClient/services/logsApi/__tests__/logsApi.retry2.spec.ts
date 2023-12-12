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

/* eslint-disable @typescript-eslint/no-unused-vars */

import { api } from '@eclipse-che/common';
import * as mockClient from '@kubernetes/client-node';
import { CoreV1Api, V1Pod } from '@kubernetes/client-node';

import { RETRY_DELAY_SECONDS, RETRY_NUMBER } from '@/devworkspaceClient/services/logsApi/const';
import { delay } from '@/services/helpers';

import { LogsApiService } from '..';

jest.mock('../const', () => ({
  RETRY_DELAY_SECONDS: 0.1,
  RETRY_NUMBER: 10,
}));

const mockLog = jest.fn().mockImplementation(() => Promise.resolve());
jest.mock('@kubernetes/client-node', () => {
  const originalModule = jest.requireActual('@kubernetes/client-node');

  return {
    __esModule: true,
    ...originalModule,
    Log: jest.fn().mockImplementation(() => ({
      log: mockLog,
    })),
  };
});

describe('Logs API Service, retry watching logs (real timers used)', () => {
  let logsApiService: LogsApiService;

  const namespace = 'user-che';
  const podName = 'pod1';
  const containerName = 'container1';
  const initContainerName = 'initContainer1';

  const stubCoreV1Api = {
    readNamespacedPod: () => {
      return Promise.resolve({
        body: getPod(podName, namespace, containerName, initContainerName),
      });
    },
  } as unknown as CoreV1Api;

  beforeEach(() => {
    const { KubeConfig } = mockClient;
    const kubeConfig = new KubeConfig();
    kubeConfig.makeApiClient = jest.fn().mockImplementation(_api => stubCoreV1Api);

    logsApiService = new LogsApiService(kubeConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should retrying watching logs until stopped', async () => {
    const params: api.webSocket.SubscribeLogsParams = {
      namespace,
      podName,
    };
    const listener = jest.fn();

    const spyWatchContainerLogs = jest.spyOn(logsApiService, '_watchContainerLogs');
    spyWatchContainerLogs.mockRejectedValue('some error');

    const promiseFn = logsApiService._retryWatchContainerLogs(listener, params, containerName);

    // wait the time for five RETRY_DELAY_SECONDS
    // so there are six attempts to watch logs to be made
    await delay(RETRY_DELAY_SECONDS * 5 * 1000);

    // and stop watching all containers
    logsApiService.stopWatching();

    await promiseFn;

    // six attempts to watch logs
    expect(spyWatchContainerLogs).toHaveBeenCalledTimes(6);
  });
});

function getPod(
  podName: string,
  namespace: string,
  containerName: string,
  initContainerName: string,
): V1Pod {
  return {
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: {
      name: podName,
      namespace,
    },
    spec: {
      containers: [
        {
          name: containerName,
        },
      ],
      initContainers: [
        {
          name: initContainerName,
        },
      ],
    },
  } as V1Pod;
}
