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

import { api } from '@eclipse-che/common';
import * as k8s from '@kubernetes/client-node';
import { V1Pod, V1Status } from '@kubernetes/client-node';
import { Request } from 'request';

import { createError } from '@/devworkspaceClient/services/helpers/createError';
import {
  CoreV1API,
  prepareCoreV1API,
} from '@/devworkspaceClient/services/helpers/prepareCoreV1API';
import { prepareCustomObjectWatch } from '@/devworkspaceClient/services/helpers/prepareCustomObjectWatch';
import { IPodApi } from '@/devworkspaceClient/types';
import { MessageListener } from '@/services/types/Observer';
import { logger } from '@/utils/logger';

const EVENT_API_ERROR_LABEL = 'CUSTOM_OBJECTS_API_ERROR';

export class PodApiService implements IPodApi {
  private readonly coreV1API: CoreV1API;
  private readonly customObjectWatch: k8s.Watch;
  private stopWatch?: () => void;

  constructor(kubeConfig: k8s.KubeConfig) {
    this.coreV1API = prepareCoreV1API(kubeConfig);
    this.customObjectWatch = prepareCustomObjectWatch(kubeConfig);
  }

  async listInNamespace(namespace: string): Promise<api.IPodList> {
    try {
      const resp = await this.coreV1API.listNamespacedPod(namespace);
      return resp.body;
    } catch (e) {
      throw createError(e, EVENT_API_ERROR_LABEL, 'Unable to list pods.');
    }
  }

  public async watchInNamespace(
    listener: MessageListener,
    params: api.webSocket.SubscribeParams,
  ): Promise<void> {
    const path = `/api/v1/namespaces/${params.namespace}/pods`;
    const queryParams = { watch: true, resourceVersion: params.resourceVersion };

    this.stopWatching();

    const request: Request = await this.customObjectWatch.watch(
      path,
      queryParams,
      (eventPhase: string, apiObj: V1Pod | V1Status) =>
        this.handleWatchMessage(eventPhase, apiObj, listener, params),
      (error: unknown) => this.handleWatchError(error, path),
    );

    this.stopWatch = () => request.destroy();
  }

  private handleWatchError(error: unknown, path: string): void {
    logger.error(error, `Stopped watching ${path}.`);
  }

  private handleWatchMessage(
    eventPhase: string,
    apiObj: k8s.V1Pod | k8s.V1Status,
    listener: MessageListener,
    params: api.webSocket.SubscribeParams,
  ): void {
    switch (eventPhase) {
      case api.webSocket.EventPhase.ADDED:
      case api.webSocket.EventPhase.MODIFIED:
      case api.webSocket.EventPhase.DELETED: {
        const pod = apiObj as V1Pod;
        listener({ eventPhase, pod });
        break;
      }
      case api.webSocket.EventPhase.ERROR: {
        const status = apiObj as V1Status;
        listener({ eventPhase, status, params });
        break;
      }
    }
  }

  /**
   * Stops watching Pods.
   */
  public stopWatching(): void {
    this.stopWatch?.();
    this.stopWatch = undefined;
  }
}
