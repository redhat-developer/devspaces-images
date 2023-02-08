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
import { CoreV1Event, V1Status } from '@kubernetes/client-node';
import { Request } from 'request';
import { MessageListener } from '../../services/types/Observer';
import { IEventApi } from '../types';
import { createError } from './helpers/createError';
import { CoreV1API, prepareCoreV1API } from './helpers/prepareCoreV1API';
import { prepareCustomObjectWatch } from './helpers/prepareCustomObjectWatch';

const EVENT_API_ERROR_LABEL = 'CUSTOM_OBJECTS_API_ERROR';

export class EventApiService implements IEventApi {
  private readonly coreV1API: CoreV1API;
  private readonly customObjectWatch: k8s.Watch;
  private stopWatch?: () => void;

  constructor(kubeConfig: k8s.KubeConfig) {
    this.coreV1API = prepareCoreV1API(kubeConfig);
    this.customObjectWatch = prepareCustomObjectWatch(kubeConfig);
  }

  async listInNamespace(namespace: string): Promise<api.IEventList> {
    try {
      const resp = await this.coreV1API.listNamespacedEvent(namespace);
      return resp.body;
    } catch (e) {
      throw createError(e, EVENT_API_ERROR_LABEL, 'Unable to list events.');
    }
  }

  public async watchInNamespace(
    namespace: string,
    resourceVersion: string,
    listener: MessageListener,
  ): Promise<void> {
    const path = `/api/v1/namespaces/${namespace}/events`;
    const queryParams = { watch: true, resourceVersion };

    this.stopWatching();

    const request: Request = await this.customObjectWatch.watch(
      path,
      queryParams,
      (eventPhase: string, apiObj: CoreV1Event | V1Status) => {
        switch (eventPhase) {
          case api.webSocket.EventPhase.ADDED:
          case api.webSocket.EventPhase.MODIFIED:
          case api.webSocket.EventPhase.DELETED: {
            const event = apiObj as CoreV1Event;
            listener({ eventPhase, event });
            break;
          }
          case api.webSocket.EventPhase.ERROR: {
            const status = apiObj as V1Status;
            listener({ eventPhase, status });
            break;
          }
        }
      },
      (error: unknown) => {
        console.error(`[ERROR] Stopped watching ${path}. Reason:`, error);
      },
    );

    this.stopWatch = () => request.destroy();
  }

  /**
   * Stops watching Events.
   */
  public stopWatching(): void {
    this.stopWatch?.();
    this.stopWatch = undefined;
  }
}
