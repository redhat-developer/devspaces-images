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
import { CoreV1Api, CoreV1Event, V1Status } from '@kubernetes/client-node';
import { EventApiService } from '../eventApi';

jest.mock('../helpers/prepareCustomObjectWatch');

const namespace = 'user-che';

// mute console.error
console.error = jest.fn();

describe('Event API Service', () => {
  let eventApiService: EventApiService;

  const stubCoreV1Api = {
    listNamespacedEvent: () => {
      return Promise.resolve({ body: buildListNamespacedEvent() });
    },
  } as unknown as CoreV1Api;
  const spyListNamespacedEvent = jest.spyOn(stubCoreV1Api, 'listNamespacedEvent');

  beforeEach(() => {
    const { KubeConfig } = mockClient;
    const kubeConfig = new KubeConfig();
    kubeConfig.makeApiClient = jest.fn().mockImplementation(_api => stubCoreV1Api);

    eventApiService = new EventApiService(kubeConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should list events', async () => {
    const res = await eventApiService.listInNamespace(namespace);
    expect(res).toEqual(buildListNamespacedEvent());
    expect(spyListNamespacedEvent).toHaveBeenCalledWith(namespace);
  });

  it('should throw when getting events list', async () => {
    const failureReason = 'failed to get events list';
    spyListNamespacedEvent.mockRejectedValue(new Error(failureReason));

    const list = async () => await eventApiService.listInNamespace(namespace);

    expect(list).rejects.toThrowError(failureReason);
  });

  it('should watch events', async () => {
    const params: api.webSocket.SubscribeParams = {
      namespace,
      resourceVersion: '123',
    };

    const spyStopWatching = jest.spyOn(eventApiService, 'stopWatching').mockReturnValue(undefined);

    const spyWatch = jest.spyOn((eventApiService as any).customObjectWatch, 'watch');

    await eventApiService.watchInNamespace(jest.fn(), params);

    expect(spyStopWatching).toHaveBeenCalled();
    expect(spyWatch).toHaveBeenCalledWith(
      `/api/v1/namespaces/${namespace}/events`,
      { watch: true, resourceVersion: '123' },
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('should stop watching events', async () => {
    const params: api.webSocket.SubscribeParams = {
      namespace,
      resourceVersion: '123',
    };
    const mockDestroy = jest.fn();

    const spyWatch = jest
      .spyOn((eventApiService as any).customObjectWatch, 'watch')
      .mockReturnValue({ body: {}, destroy: mockDestroy });

    await eventApiService.watchInNamespace(jest.fn(), params);
    eventApiService.stopWatching();

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
      kind: 'Event',
    } as CoreV1Event;
    const eventPhase = 'ADDED';

    (eventApiService as any).handleWatchMessage(eventPhase, apiObj, listener, params);
    expect(listener).toHaveBeenCalledWith({ eventPhase, event: apiObj });
  });

  it('should handle the watch messages of MODIFIED phase', async () => {
    const listener = jest.fn();
    const params: api.webSocket.SubscribeParams = {
      namespace,
      resourceVersion: '123',
    };

    const apiObj = {
      apiVersion: 'workspace.devfile.io/v1alpha2',
      kind: 'Event',
    } as CoreV1Event;
    const eventPhase = 'MODIFIED';

    (eventApiService as any).handleWatchMessage(eventPhase, apiObj, listener, params);
    expect(listener).toHaveBeenCalledWith({ eventPhase, event: apiObj });
  });

  it('should handle the watch messages of DELETE phase', async () => {
    const listener = jest.fn();
    const params: api.webSocket.SubscribeParams = {
      namespace,
      resourceVersion: '123',
    };

    const apiObj = {
      apiVersion: 'workspace.devfile.io/v1alpha2',
      kind: 'Event',
    } as CoreV1Event;
    const eventPhase = 'DELETED';

    (eventApiService as any).handleWatchMessage(eventPhase, apiObj, listener, params);
    expect(listener).toHaveBeenCalledWith({ eventPhase, event: apiObj });
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

    (eventApiService as any).handleWatchMessage(eventPhase, apiObj, listener, params);
    expect(listener).toHaveBeenCalledWith({ eventPhase, status: apiObj, params });
  });

  it('should handle the watch error', async () => {
    const path = `/api/v1/namespaces/user-che/events`;
    const error = new Error('watch error');

    (eventApiService as any).handleWatchError(error, path);
    expect(console.error).toHaveBeenCalledWith(`[ERROR] Stopped watching ${path}. Reason:`, error);
  });
});

function buildListNamespacedEvent(): api.IEventList {
  return {
    apiVersion: 'workspace.devfile.io/v1alpha2',
    items: buildEventsList(),
    kind: 'EventList',
    metadata: {
      resourceVersion: '12345',
    },
  };
}
function buildEventsList() {
  return [getEvent(), getEvent()];
}
function getEvent() {
  return {
    apiVersion: 'workspace.devfile.io/v1alpha2',
    kind: 'Event',
  } as CoreV1Event;
}
