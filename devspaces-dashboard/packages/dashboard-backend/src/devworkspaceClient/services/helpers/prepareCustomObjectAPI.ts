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

export type CustomObjectAPI = Pick<
  k8s.CustomObjectsApi,
  | 'listClusterCustomObject'
  | 'listNamespacedCustomObject'
  | 'getNamespacedCustomObject'
  | 'createNamespacedCustomObject'
  | 'replaceNamespacedCustomObject'
  | 'deleteNamespacedCustomObject'
  | 'patchNamespacedCustomObject'
>;

export function prepareCustomObjectAPI(kc: k8s.KubeConfig): CustomObjectAPI {
  const customObjectAPI = kc.makeApiClient(k8s.CustomObjectsApi);
  return {
    listClusterCustomObject: (
      ...args: Parameters<typeof customObjectAPI.listClusterCustomObject>
    ) => retryableExec(() => customObjectAPI.listClusterCustomObject(...args)),
    listNamespacedCustomObject: (
      ...args: Parameters<typeof customObjectAPI.listNamespacedCustomObject>
    ) => retryableExec(() => customObjectAPI.listNamespacedCustomObject(...args), 10),
    getNamespacedCustomObject: (
      ...args: Parameters<typeof customObjectAPI.getNamespacedCustomObject>
    ) => retryableExec(() => customObjectAPI.getNamespacedCustomObject(...args)),
    createNamespacedCustomObject: (
      ...args: Parameters<typeof customObjectAPI.createNamespacedCustomObject>
    ) => retryableExec(() => customObjectAPI.createNamespacedCustomObject(...args)),
    replaceNamespacedCustomObject: (
      ...args: Parameters<typeof customObjectAPI.replaceNamespacedCustomObject>
    ) => retryableExec(() => customObjectAPI.replaceNamespacedCustomObject(...args)),
    deleteNamespacedCustomObject: (
      ...args: Parameters<typeof customObjectAPI.deleteNamespacedCustomObject>
    ) => retryableExec(() => customObjectAPI.deleteNamespacedCustomObject(...args), 10),
    patchNamespacedCustomObject: (
      ...args: Parameters<typeof customObjectAPI.patchNamespacedCustomObject>
    ) => retryableExec(() => customObjectAPI.patchNamespacedCustomObject(...args)),
  };
}
