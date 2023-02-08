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

import * as k8s from '@kubernetes/client-node';
import { retryableExec } from './retryableExec';

export type CoreV1API = Pick<
  k8s.CoreV1Api,
  | 'listNamespace'
  | 'listNamespacedPod'
  | 'readNamespacedSecret'
  | 'replaceNamespacedSecret'
  | 'createNamespacedSecret'
  | 'listNamespacedEvent'
>;

export function prepareCoreV1API(kc: k8s.KubeConfig): CoreV1API {
  const coreV1API = kc.makeApiClient(k8s.CoreV1Api);
  return {
    listNamespace: (...args: Parameters<typeof coreV1API.listNamespace>) =>
      retryableExec(() => coreV1API.listNamespace(...args)),
    listNamespacedPod: (...args: Parameters<typeof coreV1API.listNamespacedPod>) =>
      retryableExec(() => coreV1API.listNamespacedPod(...args)),
    readNamespacedSecret: (...args: Parameters<typeof coreV1API.readNamespacedSecret>) =>
      retryableExec(() => coreV1API.readNamespacedSecret(...args)),
    replaceNamespacedSecret: (...args: Parameters<typeof coreV1API.replaceNamespacedSecret>) =>
      retryableExec(() => coreV1API.replaceNamespacedSecret(...args)),
    createNamespacedSecret: (...args: Parameters<typeof coreV1API.createNamespacedSecret>) =>
      retryableExec(() => coreV1API.createNamespacedSecret(...args)),
    listNamespacedEvent: (...args: Parameters<typeof coreV1API.listNamespacedEvent>) =>
      retryableExec(() => coreV1API.listNamespacedEvent(...args)),
  };
}
