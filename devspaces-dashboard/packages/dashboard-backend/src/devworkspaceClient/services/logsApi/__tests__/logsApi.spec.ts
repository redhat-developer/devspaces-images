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
import { CoreV1Api, HttpError, V1Pod, V1Status } from '@kubernetes/client-node';
import * as request from 'request';
import { Writable } from 'stream';

import { LogsApiService } from '@/devworkspaceClient/services/logsApi';

jest.mock('../const', () => ({
  RETRY_DELAY_SECONDS: 0.1,
  RETRY_NUMBER: 10,
}));

const mockDelay = jest.fn().mockImplementation(() => Promise.resolve());
jest.mock('../../../../services/helpers', () => ({
  delay: (ms: number) => mockDelay(ms),
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

describe('Logs API Service', () => {
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
  const spyReadNamespacedPod = jest.spyOn(stubCoreV1Api, 'readNamespacedPod');

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

  it('should watch logs', async () => {
    const params: api.webSocket.SubscribeLogsParams = {
      namespace,
      podName,
    };
    const listener = jest.fn();

    const spyStopWatching = jest.spyOn(logsApiService, 'stopWatching').mockReturnValue();

    const spyWatchContainerLogs = jest
      .spyOn(logsApiService, '_watchContainerLogs')
      .mockResolvedValue();

    await logsApiService.watchInNamespace(listener, params);

    expect(spyStopWatching).toHaveBeenCalledTimes(1);
    expect(spyReadNamespacedPod).toHaveBeenCalledTimes(1);

    expect(spyWatchContainerLogs).toHaveBeenCalledTimes(2);
    expect(spyWatchContainerLogs).toHaveBeenNthCalledWith(1, listener, params, containerName);
    expect(spyWatchContainerLogs).toHaveBeenNthCalledWith(2, listener, params, initContainerName);
  });

  it('should fail if pod is not found', async () => {
    const params: api.webSocket.SubscribeLogsParams = {
      namespace,
      podName,
    };
    const listener = jest.fn();

    const spyGetPod = jest
      .spyOn(logsApiService, '_getPod')
      .mockRejectedValueOnce(new Error('pod not found'));

    await logsApiService.watchInNamespace(listener, params);

    expect(spyGetPod).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({
      eventPhase: 'ERROR',
      params,
      status: {
        kind: 'Status',
        code: 400,
        message: 'pod not found',
        status: 'Failure',
      },
    });
  });

  it('should watch container logs', async () => {
    const params: api.webSocket.SubscribeLogsParams = {
      namespace,
      podName,
    };
    const listener = jest.fn();

    mockLog.mockResolvedValue({} as request.Request);

    await logsApiService._watchContainerLogs(listener, params, containerName);

    expect(mockLog).toHaveBeenCalledTimes(1);
    expect(mockLog).toHaveBeenCalledWith(namespace, podName, containerName, expect.any(Writable), {
      follow: true,
    });
  });

  it('should handle container logs', async () => {
    const params: api.webSocket.SubscribeLogsParams = {
      namespace,
      podName,
    };
    const listener = jest.fn();

    mockLog.mockImplementation(
      (
        _namespace: string,
        _podName: string,
        _containerName: string,
        stream: Writable,
        _options: unknown,
      ) => {
        stream.write('some log 1', 'utf8', () => {
          /* noop */
        });
        stream.write('some log 2', 'utf8', () => {
          /* noop */
        });
      },
    );

    await logsApiService._watchContainerLogs(listener, params, containerName);

    expect(mockLog).toHaveBeenCalledTimes(1);
    expect(mockLog).toHaveBeenCalledWith(namespace, podName, containerName, expect.any(Writable), {
      follow: true,
    });
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenNthCalledWith(1, {
      eventPhase: 'ADDED',
      containerName: 'container1',
      logs: 'some log 1',
      podName: 'pod1',
    });
    expect(listener).toHaveBeenNthCalledWith(2, {
      eventPhase: 'ADDED',
      containerName: 'container1',
      logs: 'some log 2',
      podName: 'pod1',
    });
  });

  it('should handle an HttpError message', async () => {
    const params: api.webSocket.SubscribeLogsParams = {
      namespace,
      podName,
    };
    const listener = jest.fn();

    const status = {
      kind: 'Status',
      code: 400,
      message: 'container not found',
      status: 'Failure',
    } as V1Status;
    mockLog.mockImplementationOnce(
      (
        _namespace: string,
        _podName: string,
        _containerName: string,
        stream: Writable,
        _options: unknown,
      ) => {
        throw {
          body: status,
          statusCode: 400,
          message: 'container not found',
          name: 'HttpError',
          response: {
            statusCode: 400,
            statusMessage: 'Bad Request',
            body: 'container not found',
          } as request.Response,
        } as HttpError;
      },
    );
    mockLog.mockResolvedValue({} as request.Request);

    try {
      await logsApiService._watchContainerLogs(listener, params, containerName);
    } catch (e) {
      // noop
    }

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({
      eventPhase: 'ERROR',
      params: { ...params, containerName },
      status,
    });
  });

  it('should handle a Status message', async () => {
    const params: api.webSocket.SubscribeLogsParams = {
      namespace,
      podName,
    };
    const listener = jest.fn();

    const status = {
      kind: 'Status',
      code: 400,
      message: 'container not found',
      status: 'Failure',
    } as V1Status;
    mockLog.mockImplementationOnce(
      (
        _namespace: string,
        _podName: string,
        _containerName: string,
        stream: Writable,
        _options: unknown,
      ) => {
        throw status;
      },
    );
    mockLog.mockResolvedValue({} as request.Request);

    try {
      await logsApiService._watchContainerLogs(listener, params, containerName);
    } catch (e) {
      // noop
    }

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({
      eventPhase: 'ERROR',
      params: { ...params, containerName },
      status,
    });
  });

  it('should handle a Response', async () => {
    const params: api.webSocket.SubscribeLogsParams = {
      namespace,
      podName,
    };
    const listener = jest.fn();

    const expectedStatus = {
      kind: 'Status',
      code: 400,
      message: 'container not found',
      status: 'Failure',
    } as V1Status;

    mockLog.mockImplementationOnce(
      (
        _namespace: string,
        _podName: string,
        _containerName: string,
        stream: Writable,
        _options: unknown,
      ) => {
        throw {
          body: 'container not found',
          statusCode: 400,
          statusMessage: 'container not found',
        } as request.Response;
      },
    );
    mockLog.mockResolvedValue({} as request.Request);

    await logsApiService.watchInNamespace(listener, params);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({
      eventPhase: 'ERROR',
      params: { ...params, containerName },
      status: expectedStatus,
    });
  });

  it('should handle an non-response error', async () => {
    const params: api.webSocket.SubscribeLogsParams = {
      namespace,
      podName,
    };
    const listener = jest.fn();

    const expectedStatus = {
      kind: 'Status',
      code: 400,
      message: 'container not found',
      status: 'Failure',
    } as V1Status;

    mockLog.mockImplementationOnce(
      (
        _namespace: string,
        _podName: string,
        _containerName: string,
        stream: Writable,
        _options: unknown,
      ) => {
        throw {
          message: 'container not found',
        };
      },
    );
    mockLog.mockResolvedValue({} as request.Request);

    await logsApiService.watchInNamespace(listener, params);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({
      eventPhase: 'ERROR',
      params: { ...params, containerName },
      status: expectedStatus,
    });
  });

  it('should stop watching all containers logs', async () => {
    const params1: api.webSocket.SubscribeLogsParams = {
      namespace,
      podName,
    };
    const params2: api.webSocket.SubscribeLogsParams = {
      namespace,
      podName,
    };
    const listener = jest.fn();

    const mockDestroy = jest.fn();
    mockLog.mockResolvedValue({ destroy: () => mockDestroy() } as request.Request);
    const spyStopWatching = jest.spyOn(logsApiService, 'stopWatching');

    await logsApiService.watchInNamespace(listener, params1);
    await logsApiService.watchInNamespace(listener, params2);

    // two pods times two containers
    expect(mockLog).toHaveBeenCalledTimes(4);

    expect(spyStopWatching).toHaveBeenCalledTimes(2);
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
