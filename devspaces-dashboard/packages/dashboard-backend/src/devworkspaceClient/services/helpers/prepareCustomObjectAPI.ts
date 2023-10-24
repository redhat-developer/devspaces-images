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

import { retryableExec } from '@/devworkspaceClient/services/helpers/retryableExec';

export type CustomObjectAPI = Pick<
  k8s.CustomObjectsApi,
  | 'getClusterCustomObject'
  | 'listClusterCustomObject'
  | 'listNamespacedCustomObject'
  | 'getNamespacedCustomObject'
  | 'createNamespacedCustomObject'
  | 'replaceNamespacedCustomObject'
  | 'deleteNamespacedCustomObject'
  | 'patchNamespacedCustomObject'
>;

export function prepareCustomObjectAPI(kc: k8s.KubeConfig): CustomObjectAPI {
  const customObjectsApi = kc.makeApiClient(k8s.CustomObjectsApi);
  return {
    getClusterCustomObject: (...args: Parameters<typeof customObjectsApi.getClusterCustomObject>) =>
      retryableExec(() => customObjectsApi.getClusterCustomObject(...args)),
    listClusterCustomObject: (
      ...args: Parameters<typeof customObjectsApi.listClusterCustomObject>
    ) => retryableExec(() => customObjectsApi.listClusterCustomObject(...args)),
    listNamespacedCustomObject: (
      ...args: Parameters<typeof customObjectsApi.listNamespacedCustomObject>
    ) => retryableExec(() => customObjectsApi.listNamespacedCustomObject(...args)),
    getNamespacedCustomObject: (
      ...args: Parameters<typeof customObjectsApi.getNamespacedCustomObject>
    ) => retryableExec(() => customObjectsApi.getNamespacedCustomObject(...args)),
    createNamespacedCustomObject: (
      ...args: Parameters<typeof customObjectsApi.createNamespacedCustomObject>
    ) => retryableExec(() => customObjectsApi.createNamespacedCustomObject(...args)),
    replaceNamespacedCustomObject: (
      ...args: Parameters<typeof customObjectsApi.replaceNamespacedCustomObject>
    ) => retryableExec(() => customObjectsApi.replaceNamespacedCustomObject(...args)),
    deleteNamespacedCustomObject: (
      ...args: Parameters<typeof customObjectsApi.deleteNamespacedCustomObject>
    ) => retryableExec(() => customObjectsApi.deleteNamespacedCustomObject(...args)),
    patchNamespacedCustomObject: (
      ...args: Parameters<typeof customObjectsApi.patchNamespacedCustomObject>
    ) => retryableExec(() => customObjectsApi.patchNamespacedCustomObject(...args)),
  };
}
