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
import * as helpers from '@/services/helpers';

import { LogsApiService } from '..';

jest.mock('../const', () => ({
  RETRY_DELAY_SECONDS: 0.1,
  RETRY_NUMBER: 10,
}));

const spyDelay = jest.spyOn(helpers, 'delay').mockResolvedValue();

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

describe('Logs API Service, retry watching logs (fake timers used)', () => {
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
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should retry watching logs once', async () => {
    const params: api.webSocket.SubscribeLogsParams = {
      namespace,
      podName,
    };
    const listener = jest.fn();

    const spyWatchContainerLogs = jest.spyOn(logsApiService, '_watchContainerLogs');
    spyWatchContainerLogs.mockRejectedValueOnce('some error');
    spyWatchContainerLogs.mockResolvedValue();

    await logsApiService._retryWatchContainerLogs(listener, params, containerName);

    // one failed and one successful attempts
    expect(spyWatchContainerLogs).toHaveBeenCalledTimes(2);

    // one delay for each failed attempt
    expect(spyDelay).toHaveBeenCalledTimes(1);
    expect(spyDelay).toHaveBeenCalledWith(RETRY_DELAY_SECONDS * 1000);
  });

  it('should retry watching logs up to the max number of tries', async () => {
    const params: api.webSocket.SubscribeLogsParams = {
      namespace,
      podName,
    };
    const listener = jest.fn();

    const spyWatchContainerLogs = jest.spyOn(logsApiService, '_watchContainerLogs');
    spyWatchContainerLogs.mockRejectedValue('some error');

    await logsApiService._retryWatchContainerLogs(listener, params, containerName);

    expect(spyWatchContainerLogs).toHaveBeenCalledTimes(RETRY_NUMBER);

    expect(spyDelay).toHaveBeenCalledTimes(RETRY_NUMBER);
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
