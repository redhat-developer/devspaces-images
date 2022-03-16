/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
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
import { IKubeConfigApi } from '../../types';
import { StdStream } from '../helpers/stream';
import { helpers } from '@eclipse-che/common';

export class KubeConfigAPI implements IKubeConfigApi {
  private readonly execAPI: k8s.Exec;
  private readonly corev1API: k8s.CoreV1Api;
  private readonly kubeConfig: string;

  constructor(kc: k8s.KubeConfig) {
    this.execAPI = new k8s.Exec(kc);
    this.corev1API = kc.makeApiClient(k8s.CoreV1Api);
    this.kubeConfig = kc.exportConfig();
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

    try {
      for (const container of currentPodContainers) {
        const containerName = container.name;

        // find the directory where we should create the kubeconfig
        const kubeConfigDirectory = await this.resolveDirectory(podName, namespace, containerName);
        if (kubeConfigDirectory === '') {
          console.log(
            `Could not find appropriate kubeconfig directory for ${namespace}/${podName}/${containerName}`,
          );
          continue;
        }

        // then create the directory if it doesn't exist
        await this.exec(podName, namespace, containerName, [
          'sh',
          '-c',
          `mkdir -p ${kubeConfigDirectory}`,
        ]);

        // if -f ${kubeConfigDirectory}/config is not found then sync kubeconfig to the container
        await this.exec(podName, namespace, containerName, [
          'sh',
          '-c',
          `[ -f ${kubeConfigDirectory}/config ] || echo '${this.kubeConfig}' > ${kubeConfigDirectory}/config`,
        ]);
      }
    } catch (e) {
      throw `Failed to inject kubeconfig. ${helpers.errors.getMessage(e)}`;
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
      const kubeConfigEnvResolver = await this.exec(name, namespace, containerName, [
        'sh',
        '-c',
        'echo $KUBECONFIG',
      ]);

      if (kubeConfigEnvResolver.stdOut) {
        return kubeConfigEnvResolver.stdOut.replace(new RegExp('/config$'), '');
      }
    } catch (e) {
      console.log(
        `Could not resolve the kubeconfig env variable in ${namespace}/${name}/${containerName}`,
      );
    }

    try {
      // attempt to resolve the home directory
      const homeEnvResolution = await this.exec(name, namespace, containerName, [
        'sh',
        '-c',
        'echo $HOME',
      ]);

      if (homeEnvResolution.stdOut) {
        if (homeEnvResolution.stdOut.substr(-1) === '/') {
          return homeEnvResolution.stdOut + '.kube';
        } else {
          return homeEnvResolution.stdOut + '/.kube';
        }
      }
    } catch (e) {
      const message = helpers.errors.getMessage(e);
      throw `Failed to run command 'echo $HOME' in '${namespace}/${name}/${containerName}' with message: '${message}'`;
    }
    return '';
  }

  /**
   * Execute the given command inside of a given container in a pod with a name and namespace and return the
   * stdout and stderr responses
   * @param name The name of the pod
   * @param namespace The namespace where the pod lives
   * @param containerName The name of the container
   * @param command The command to return
   * @returns The strings containing the stdout and stderr of running the command in the container
   */
  private async exec(
    name: string,
    namespace: string,
    containerName: string,
    command: string[],
  ): Promise<{ stdOut: string }> {
    const stdOutStream = new StdStream();

    // Wait until the exec request is done and reject if the final status is a failure, otherwise
    // everything went OK and stdOutStream contains the response
    await new Promise((resolve, reject) => {
      const promise = this.execAPI.exec(
        namespace,
        name,
        containerName,
        command,
        stdOutStream,
        null,
        null,
        true,
        (status: k8s.V1Status) => {
          if (status.status === 'Failure') {
            reject(status);
          } else {
            resolve(status);
          }
        },
      );
      promise.catch(error => {
        reject(error);
      });
    });

    return {
      stdOut: stdOutStream.chunks,
    };
  }
}
