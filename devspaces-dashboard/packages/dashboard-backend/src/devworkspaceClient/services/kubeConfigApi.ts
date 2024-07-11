/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { helpers } from '@eclipse-che/common';
import * as k8s from '@kubernetes/client-node';

import { exec, ServerConfig } from '@/devworkspaceClient/services/helpers/exec';
import {
  CoreV1API,
  prepareCoreV1API,
} from '@/devworkspaceClient/services/helpers/prepareCoreV1API';
import { IKubeConfigApi } from '@/devworkspaceClient/types';
import { logger } from '@/utils/logger';

const EXCLUDED_CONTAINERS = ['che-gateway', 'che-machine-exec'];

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
   * Inject the kubeconfig into all containers with the given name in the namespace
   * @param namespace The namespace where the pod lives
   * @param devworkspaceId The id of the devworkspace
   */
  async injectKubeConfig(namespace: string, devworkspaceId: string): Promise<void> {
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
        // find the directory where we should create the kubeconfig
        const kubeConfigDirectory = await this.resolveDirectory(podName, namespace, containerName);
        if (kubeConfigDirectory === '') {
          logger.info(
            `Could not find appropriate kubeconfig directory for ${namespace}/${podName}/${containerName}`,
          );
          continue;
        }

        // then create the directory if it doesn't exist
        await exec(
          podName,
          namespace,
          containerName,
          ['sh', '-c', `mkdir -p ${kubeConfigDirectory}`],
          this.getServerConfig(),
        );

        // check if the kubeconfig is already mounted
        if (container.volumeMounts?.some(vm => vm.mountPath === kubeConfigDirectory)) {
          logger.info(
            `Kubeconfig is already mounted in ${namespace}/${podName}/${containerName} skipping...`,
          );
          continue;
        }
        let kubeConfig = this.setNamespaceInContext(this.kubeConfig, namespace);

        // Get the kubeconfig from the container
        const { stdOut, stdError } = await exec(
          podName,
          namespace,
          containerName,
          ['sh', '-c', `[ -f ${kubeConfigDirectory}/config ] || cat ${kubeConfigDirectory}/config`],
          this.getServerConfig(),
        );

        if (stdError !== '') {
          logger.warn(`Error reading kubeconfig from container: ${stdError}`);
        }
        if (stdError === '' && stdOut !== '') {
          kubeConfig = this.mergeKubeConfig(stdOut, kubeConfig);
        }

        await exec(
          podName,
          namespace,
          containerName,
          [
            'sh',
            '-c',
            `[ -f ${kubeConfigDirectory}/config ] || echo '${kubeConfig}' > ${kubeConfigDirectory}/config`,
          ],
          this.getServerConfig(),
        );

        if (!resolved) {
          resolved = true;
        }
      } catch (e) {
        logger.warn(e);
      }
    }
    if (!resolved) {
      throw new Error(`Could not add kubeconfig into containers in ${namespace}`);
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

  /**
   * Resolve the directory where the kubeconfig is going to live. First it looks for the $KUBECONFIG env variable if
   * that is found then use that. If that is not found then the default directory is $HOME/.kube
   * @param name The name of the pod
   * @param namespace The namespace where the pod lives
   * @param containerName The name of the container to resolve the directory for
   * @returns A promise of the directory where the kubeconfig is going to live
   */
  private async resolveDirectory(
    name: string,
    namespace: string,
    containerName: string,
  ): Promise<string> {
    try {
      // attempt to resolve the kubeconfig env variable
      const kubeConfigEnvResolver = await exec(
        name,
        namespace,
        containerName,
        ['sh', '-c', 'printenv KUBECONFIG'],
        this.getServerConfig(),
      );

      if (kubeConfigEnvResolver.stdOut) {
        return kubeConfigEnvResolver.stdOut.replace(new RegExp('/config$'), '');
      }
    } catch (e) {
      logger.error(
        e,
        `Failed to run command "printenv KUBECONFIG" in "${namespace}/${name}/${containerName}"`,
      );
    }

    try {
      // attempt to resolve the home directory
      const homeEnvResolution = await exec(
        name,
        namespace,
        containerName,
        ['sh', '-c', 'printenv HOME'],
        this.getServerConfig(),
      );

      if (homeEnvResolution.stdOut) {
        if (homeEnvResolution.stdOut.substr(-1) === '/') {
          return homeEnvResolution.stdOut + '.kube';
        } else {
          return homeEnvResolution.stdOut + '/.kube';
        }
      }
    } catch (e) {
      logger.error(
        e,
        `Failed to run command "printenv HOME" in "${namespace}/${name}/${containerName}"`,
      );
    }
    return '';
  }

  private setNamespaceInContext(kubeConfig: string, namespace: string): string {
    try {
      const kubeConfigJson = JSON.parse(kubeConfig);
      for (const context of kubeConfigJson.contexts) {
        context.context.namespace = namespace;
      }
      return JSON.stringify(kubeConfigJson, undefined, '  ');
    } catch (e) {
      logger.error(e, 'Failed to parse kubeconfig');
      return kubeConfig;
    }
  }

  private mergeKubeConfig(kubeconfigSource: string, generatedKubeconfig: string): string {
    try {
      const kubeConfigJson = JSON.parse(kubeconfigSource);
      const generatedKubeConfigJson = JSON.parse(generatedKubeconfig);
      for (const context of generatedKubeConfigJson.contexts) {
        if (kubeConfigJson.contexts.find((c: any) => c.name === context.name)) {
          kubeConfigJson.contexts = kubeConfigJson.contexts.filter(
            (c: any) => c.name !== context.name,
          );
        }
        kubeConfigJson.contexts.push(context);
      }
      for (const cluster of generatedKubeConfigJson.clusters) {
        if (kubeConfigJson.clusters.find((c: any) => c.name === cluster.name)) {
          kubeConfigJson.clusters = kubeConfigJson.clusters.filter(
            (c: any) => c.name !== cluster.name,
          );
        }
        kubeConfigJson.clusters.push(cluster);
      }
      for (const user of generatedKubeConfigJson.users) {
        if (kubeConfigJson.users.find((c: any) => c.name === user.name)) {
          kubeConfigJson.users = kubeConfigJson.users.filter((c: any) => c.name !== user.name);
        }
        kubeConfigJson.users.push(user);
      }
      return JSON.stringify(kubeConfigJson, undefined, '  ');
    } catch (e) {
      logger.error(e, 'Failed to merge kubeconfig');
      return kubeconfigSource;
    }
  }
}
