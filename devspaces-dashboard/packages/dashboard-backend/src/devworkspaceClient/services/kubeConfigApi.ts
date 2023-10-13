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

import { helpers, KUBECONFIG_MOUNT_PATH } from '@eclipse-che/common';
import * as k8s from '@kubernetes/client-node';
import { V1Secret } from '@kubernetes/client-node';

import { ServerConfig } from '@/devworkspaceClient/services/helpers/exec';
import {
  CoreV1API,
  prepareCoreV1API,
} from '@/devworkspaceClient/services/helpers/prepareCoreV1API';
import { IKubeConfigApi } from '@/devworkspaceClient/types';

const KUBECONFIG_SECRET_NAME = 'kubeconfig';

export class KubeConfigApiService implements IKubeConfigApi {
  private readonly corev1API: CoreV1API;
  private readonly kubeConfig: string;
  private readonly getServerConfig: () => ServerConfig;

  constructor(kc: k8s.KubeConfig) {
    this.corev1API = prepareCoreV1API(kc);

    this.kubeConfig = kc.exportConfig();

    const server = kc.getCurrentCluster()?.server || '';
    const opts = {};
    kc.applyToRequest(opts as any);
    this.getServerConfig = () => ({ opts, server });
  }

  /**
   * Creates or replaces kubeconfig Secret to be mounted into all containers in a namespace.
   * @param namespace The namespace where the pod lives
   */
  async applyKubeConfigSecret(namespace: string): Promise<void> {
    const kubeConfig = this.setNamespaceInContext(this.kubeConfig, namespace);
    const kubeConfigSecret = {
      apiVersion: 'v1',
      data: { config: Buffer.from(kubeConfig, 'binary').toString('base64') },
      metadata: {
        name: KUBECONFIG_SECRET_NAME,
        labels: {
          'controller.devfile.io/mount-to-devworkspace': 'true',
          'controller.devfile.io/watch-secret': 'true',
        },
        annotations: {
          'controller.devfile.io/mount-as': 'file',
          'controller.devfile.io/mount-path': KUBECONFIG_MOUNT_PATH,
        },
      },
      kind: 'Secret',
    } as V1Secret;

    try {
      await this.corev1API.readNamespacedSecret(KUBECONFIG_SECRET_NAME, namespace);
      await this.corev1API.replaceNamespacedSecret(
        KUBECONFIG_SECRET_NAME,
        namespace,
        kubeConfigSecret,
      );
    } catch (error) {
      if (helpers.errors.isKubeClientError(error) && error.statusCode === 404) {
        await this.corev1API.createNamespacedSecret(namespace, kubeConfigSecret);
        return;
      }

      console.error('Failed to create kubeconfig Secret', error);
      throw new Error(
        `Could not create ${KUBECONFIG_SECRET_NAME} Secret in ${namespace} namespace`,
      );
    }
  }

  private setNamespaceInContext(kubeConfig: string, namespace: string): string {
    try {
      const kubeConfigJson = JSON.parse(kubeConfig);
      for (const context of kubeConfigJson.contexts) {
        context.context.namespace = namespace;
      }
      return JSON.stringify(kubeConfigJson, undefined, '  ');
    } catch (e) {
      console.error('Failed to parse kubeconfig', e);
      return kubeConfig;
    }
  }
}
