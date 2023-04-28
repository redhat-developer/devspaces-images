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
import { IPodmanApi } from '../types';
import { helpers } from '@eclipse-che/common';
import { exec, ServerConfig } from './helpers/exec';
import { CoreV1API, prepareCoreV1API } from './helpers/prepareCoreV1API';

const EXCLUDED_CONTAINERS = ['che-gateway', 'che-machine-exec'];

export class PodmanApiService implements IPodmanApi {
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
   * Executes the 'podman login' command to the OpenShift internal registry
   * @param namespace The namespace where the pod lives
   * @param devworkspaceId The id of the devworkspace
   */
  async podmanLogin(namespace: string, devworkspaceId: string): Promise<void> {
    const currentPod = await this.getPodByDevWorkspaceId(namespace, devworkspaceId);
    const podName = currentPod.metadata?.name || '';
    const currentPodContainers = currentPod.spec?.containers || [];

    let resolved = false;
    for (const container of currentPodContainers) {
      const containerName = container.name;
      if (EXCLUDED_CONTAINERS.indexOf(containerName) !== -1) {
        continue;
      }

      try {
        await exec(
          podName,
          namespace,
          containerName,
          [
            'sh',
            '-c',
            `podman login --cert-dir /var/run/secrets/kubernetes.io/serviceaccount -u $(oc whoami) -p $(oc whoami -t) image-registry.openshift-image-registry.svc:5000`,
          ],
          this.getServerConfig(),
        );
        if (!resolved) {
          resolved = true;
        }
      } catch (e) {
        console.warn(helpers.errors.getMessage(e));
      }
    }
    if (!resolved) {
      throw new Error(`Could not 'podman login' into containers in ${namespace}`);
    }
  }

  /**
   * Given a namespace, find a pod that has the label controller.devfile.io/devworkspace_id=${devworkspaceId}
   * @param namespace The namespace to look in
   * @param devworkspaceId The id of the devworkspace
   * @returns The containers for the first pod with given devworkspaceId
   */
  private async getPodByDevWorkspaceId(
    namespace: string,
    devworkspaceId: string,
  ): Promise<k8s.V1Pod> {
    try {
      const resp = await this.corev1API.listNamespacedPod(
        namespace,
        undefined,
        false,
        undefined,
        undefined,
        `controller.devfile.io/devworkspace_id=${devworkspaceId}`,
      );
      if (resp.body.items.length === 0) {
        throw new Error(
          `Could not find requested devworkspace with id ${devworkspaceId} in ${namespace}`,
        );
      }
      return resp.body.items[0];
    } catch (e: any) {
      throw new Error(
        `Error occurred when attempting to retrieve pod. ${helpers.errors.getMessage(e)}`,
      );
    }
  }
}
