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

import { api, helpers } from '@eclipse-che/common';
import * as k8s from '@kubernetes/client-node';
import { Log, V1Container, V1Pod, V1Status } from '@kubernetes/client-node';
import { Writable } from 'stream';
import { isHttpError, isResponse, isV1Status } from '../../../helpers/typeguards';
import { delay } from '../../../services/helpers';
import { MessageListener } from '../../../services/types/Observer';
import { ILogsApi } from '../../types';
import { CoreV1API, prepareCoreV1API } from '../helpers/prepareCoreV1API';
import { RETRY_DELAY_SECONDS, RETRY_NUMBER } from './const';

type StopWatchCallback = () => void;
type ContainerName = string;
type ContainerCallbackTuple = [ContainerName, StopWatchCallback];

export class LogsApiService implements ILogsApi {
  private readonly coreV1API: CoreV1API;
  private readonly log: k8s.Log;
  private stopWatchCallbacks: Map<
    api.webSocket.SubscribeLogsParams,
    Array<ContainerCallbackTuple>
  > = new Map();
  private stopRetryingCallbacks: Map<
    api.webSocket.SubscribeLogsParams,
    Array<ContainerCallbackTuple>
  > = new Map();

  constructor(kubeConfig: k8s.KubeConfig) {
    this.coreV1API = prepareCoreV1API(kubeConfig);
    this.log = new Log(kubeConfig);
  }

  public async watchInNamespace(
    listener: MessageListener,
    params: api.webSocket.SubscribeLogsParams,
  ): Promise<void> {
    this.stopWatching();

    const allContainers: V1Container[] = [];
    try {
      const pod = await this._getPod(params);

      const containers = pod.spec?.containers || [];
      allContainers.push(...containers);
      const initContainers = pod.spec?.initContainers || [];
      allContainers.push(...initContainers);
    } catch (e) {
      const status = this.buildStatus(e);
      listener({
        eventPhase: api.webSocket.EventPhase.ERROR,
        status,
        params,
      });

      console.warn(`Unable to watch logs in pod "${params.podName}". Error:`, e);
    }

    await Promise.all(
      allContainers.map(async container => {
        await this._retryWatchContainerLogs(listener, params, container.name);
      }),
    );
  }

  public stopWatching(): void {
    this.stopWatchCallbacks.forEach((_callbackTuples, key) => this.stopWatchingPodLogs(key));
    this.stopRetryingCallbacks.forEach((_callbackTuples, key) =>
      this.stopRetryingWatchPodLogs(key),
    );
  }

  private stopWatchingPodLogs(params: api.webSocket.SubscribeLogsParams): void {
    const callbackTuples = this.stopWatchCallbacks.get(params);
    if (callbackTuples === undefined) {
      return;
    }

    callbackTuples.forEach(([, stopWatchCallback]) => {
      stopWatchCallback();
    });
    this.stopWatchCallbacks.delete(params);
  }

  private stopRetryingWatchPodLogs(params: api.webSocket.SubscribeLogsParams): void {
    const callbackTuples = this.stopRetryingCallbacks.get(params);
    if (callbackTuples === undefined) {
      return;
    }

    callbackTuples.forEach(([, stopRetryCallback]) => {
      stopRetryCallback();
    });
    this.stopRetryingCallbacks.delete(params);
  }

  public async _retryWatchContainerLogs(
    listener: MessageListener,
    params: api.webSocket.SubscribeLogsParams,
    containerName: string,
  ): Promise<void> {
    let stopRetry = false;
    this.storeRetryCallback(params, containerName, () => (stopRetry = true));
    const getStopRetry = () => stopRetry;

    for (let i = 0; i < RETRY_NUMBER; i++) {
      try {
        await this._watchContainerLogs(listener, params, containerName);
        break;
      } catch (e) {
        const doBreak = getStopRetry();
        if (doBreak) {
          break;
        }
        await delay(RETRY_DELAY_SECONDS * 1000);
      }
    }
  }

  private storeStopWatchCallback(
    params: api.webSocket.SubscribeLogsParams,
    containerName: string,
    stopWatchCallback: StopWatchCallback,
  ): void {
    const callbackTuples = this.stopWatchCallbacks.get(params);
    if (callbackTuples === undefined) {
      this.stopWatchCallbacks.set(params, [[containerName, stopWatchCallback]]);
    } else {
      callbackTuples.push([containerName, stopWatchCallback]);
    }
  }

  private storeRetryCallback(
    params: api.webSocket.SubscribeLogsParams,
    containerName: string,
    stopRetryCallback: StopWatchCallback,
  ): void {
    const callbackTuples = this.stopRetryingCallbacks.get(params);
    if (callbackTuples === undefined) {
      this.stopRetryingCallbacks.set(params, [[containerName, stopRetryCallback]]);
    } else {
      callbackTuples.push([containerName, stopRetryCallback]);
    }
  }

  public async _watchContainerLogs(
    listener: MessageListener,
    params: api.webSocket.SubscribeLogsParams,
    containerName: string,
  ): Promise<void> {
    const { podName, namespace } = params;

    const logStream = new Writable();
    logStream._write = (chunk, _encoding, next) => {
      listener({
        eventPhase: api.webSocket.EventPhase.ADDED,
        containerName,
        podName,
        logs: chunk.toString(),
      });
      next();
    };

    try {
      const request = await this.log.log(namespace, podName, containerName, logStream, {
        follow: true,
      });
      this.storeStopWatchCallback(params, containerName, () => request.destroy());
    } catch (e) {
      const status = this.buildStatus(e);
      console.warn(status.message);

      listener({
        eventPhase: api.webSocket.EventPhase.ERROR,
        status,
        params: { ...params, containerName },
      });

      console.warn(`Unable to watch logs of ${containerName} in ${podName}: ${status.message}`);
      throw e;
    }
  }

  private buildStatus(e: unknown): V1Status {
    if (isV1Status(e)) {
      return e;
    } else if (isHttpError(e)) {
      return e.body;
    }

    let code: number;
    let message: string;

    if (helpers.errors.isError(e)) {
      code = 400;
      message = e.message;
    } else if (isResponse(e)) {
      code = e.statusCode;
      message = e.statusMessage;
    } else {
      code = 400;
      message = helpers.errors.getMessage(e);
    }

    return {
      kind: 'Status',
      code,
      message,
      status: 'Failure',
    };
  }

  public async _getPod(params: api.webSocket.SubscribeLogsParams): Promise<V1Pod> {
    const resp = await this.coreV1API.readNamespacedPod(params.podName, params.namespace);
    return resp.body;
  }
}
