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
import { CoreV1Api, V1Pod, V1Status } from '@kubernetes/client-node';
import { PodApiService } from '../podApi';

jest.mock('../helpers/prepareCustomObjectWatch');

const namespace = 'user-che';

// mute console.error
console.error = jest.fn();

describe('Pod API Service', () => {
  let podApiService: PodApiService;

  const stubCoreV1Api = {
    listNamespacedPod: () => {
      return Promise.resolve({ body: buildListNamespacedPod() });
    },
  } as unknown as CoreV1Api;
  const spyListNamespacedPod = jest.spyOn(stubCoreV1Api, 'listNamespacedPod');

  beforeEach(() => {
    const { KubeConfig } = mockClient;
    const kubeConfig = new KubeConfig();
    kubeConfig.makeApiClient = jest.fn().mockImplementation(_api => stubCoreV1Api);

    podApiService = new PodApiService(kubeConfig);

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it('should list pods', async () => {
    const res = await podApiService.listInNamespace(namespace);
    expect(res).toEqual(buildListNamespacedPod());
    expect(spyListNamespacedPod).toHaveBeenCalledWith(namespace);
  });

  it('should throw when getting pods list', async () => {
    const failureReason = 'failed to get pods list';
    spyListNamespacedPod.mockRejectedValue(new Error(failureReason));

    const list = async () => await podApiService.listInNamespace(namespace);

    expect(list).rejects.toThrowError(failureReason);
  });

  it('should watch pods', async () => {
    const params: api.webSocket.SubscribeParams = {
      namespace,
      resourceVersion: '123',
    };

    const spyStopWatching = jest.spyOn(podApiService, 'stopWatching').mockReturnValue(undefined);

    const spyWatch = jest.spyOn((podApiService as any).customObjectWatch, 'watch');

    await podApiService.watchInNamespace(jest.fn(), params);

    expect(spyStopWatching).toHaveBeenCalled();
    expect(spyWatch).toHaveBeenCalledWith(
      `/api/v1/namespaces/${namespace}/pods`,
      { watch: true, resourceVersion: '123' },
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('should stop watching pods', async () => {
    const params: api.webSocket.SubscribeParams = {
      namespace,
      resourceVersion: '123',
    };
    const mockDestroy = jest.fn();

    const spyWatch = jest
      .spyOn((podApiService as any).customObjectWatch, 'watch')
      .mockReturnValue({ body: {}, destroy: mockDestroy });

    await podApiService.watchInNamespace(jest.fn(), params);
    podApiService.stopWatching();

    expect(spyWatch).toHaveBeenCalledTimes(1);
    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });

  it('should handle the watch messages of ADDED phase', async () => {
    const listener = jest.fn();
    const params: api.webSocket.SubscribeParams = {
      namespace,
      resourceVersion: '123',
    };

    const apiObj = {
      apiVersion: 'workspace.devfile.io/v1alpha2',
      kind: 'Pod',
    } as V1Pod;
    const eventPhase = 'ADDED';

    (podApiService as any).handleWatchMessage(eventPhase, apiObj, listener, params);
    expect(listener).toHaveBeenCalledWith({ eventPhase, pod: apiObj });
  });

  it('should handle the watch messages of MODIFIED phase', async () => {
    const listener = jest.fn();
    const params: api.webSocket.SubscribeParams = {
      namespace,
      resourceVersion: '123',
    };

    const apiObj = {
      apiVersion: 'workspace.devfile.io/v1alpha2',
      kind: 'Pod',
    } as V1Pod;
    const eventPhase = 'MODIFIED';

    (podApiService as any).handleWatchMessage(eventPhase, apiObj, listener, params);
    expect(listener).toHaveBeenCalledWith({ eventPhase, pod: apiObj });
  });

  it('should handle the watch messages of DELETE phase', async () => {
    const listener = jest.fn();
    const params: api.webSocket.SubscribeParams = {
      namespace,
      resourceVersion: '123',
    };

    const apiObj = {
      apiVersion: 'workspace.devfile.io/v1alpha2',
      kind: 'Pod',
    } as V1Pod;
    const eventPhase = 'DELETED';

    (podApiService as any).handleWatchMessage(eventPhase, apiObj, listener, params);
    expect(listener).toHaveBeenCalledWith({ eventPhase, pod: apiObj });
  });

  it('should handle the watch messages of ERROR phase', async () => {
    const listener = jest.fn();
    const params: api.webSocket.SubscribeParams = {
      namespace,
      resourceVersion: '123',
    };

    const apiObj = {
      apiVersion: 'workspace.devfile.io/v1alpha2',
      kind: 'Status',
    } as V1Status;
    const eventPhase = 'ERROR';

    (podApiService as any).handleWatchMessage(eventPhase, apiObj, listener, params);
    expect(listener).toHaveBeenCalledWith({ eventPhase, status: apiObj, params });
  });

  it('should handle the watch error', async () => {
    const path = `/api/v1/namespaces/user-che/events`;
    const error = new Error('watch error');

    (podApiService as any).handleWatchError(error, path);
    expect(console.error).toHaveBeenCalledWith(`[ERROR] Stopped watching ${path}. Reason:`, error);
  });
});

function buildListNamespacedPod(): api.IPodList {
  return {
    apiVersion: 'workspace.devfile.io/v1alpha2',
    items: buildPodsList(),
    kind: 'PodList',
    metadata: {
      resourceVersion: '12345',
    },
  };
}
function buildPodsList() {
  return [getPod(), getPod()];
}
function getPod() {
  return {
    apiVersion: 'workspace.devfile.io/v1alpha2',
    kind: 'Pod',
  } as V1Pod;
}
