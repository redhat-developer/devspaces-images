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
import { helpers } from '@eclipse-che/common';
import WebSocket from 'ws';
import { stringify } from 'querystring';

const EXCLUDED_CONTAINERS = ['che-gateway', 'che-machine-exec'];

const PROTOCOLS = ['base64.channel.k8s.io'];

enum CHANNELS {
  STD_OUT = 1,
  STD_ERROR,
  ERROR,
}

export class KubeConfigApi implements IKubeConfigApi {
  private readonly corev1API: k8s.CoreV1Api;
  private readonly kubeConfig: string;
  private readonly getServerConfig: () => { opts: { [key: string]: any }; server: string };

  constructor(kc: k8s.KubeConfig) {
    this.corev1API = kc.makeApiClient(k8s.CoreV1Api);
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

        if (!resolved) {
          resolved = true;
        }
      } catch (e) {
        console.warn(helpers.errors.getMessage(e));
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
      const kubeConfigEnvResolver = await this.exec(name, namespace, containerName, [
        'sh',
        '-c',
        'printenv KUBECONFIG',
      ]);

      if (kubeConfigEnvResolver.stdOut) {
        return kubeConfigEnvResolver.stdOut.replace(new RegExp('/config$'), '');
      }
    } catch (e) {
      const message = helpers.errors.getMessage(e);
      console.error(
        `Failed to run command 'printenv KUBECONFIG' in '${namespace}/${name}/${containerName}' with message: '${message}'`,
      );
    }

    try {
      // attempt to resolve the home directory
      const homeEnvResolution = await this.exec(name, namespace, containerName, [
        'sh',
        '-c',
        'printenv HOME',
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
      console.error(
        `Failed to run command 'printenv HOME' in '${namespace}/${name}/${containerName}' with message: '${message}'`,
      );
    }
    return '';
  }

  /**
   * Execute the given command inside of a given container in a pod with a name and namespace and return the
   * stdout and stderr responses
   * @param pod The name of the pod
   * @param namespace The namespace where the pod lives
   * @param container The name of the container
   * @param command The command to return
   * @returns The object containing the stdOut and stdErr of running the command in the container
   */
  private async exec(
    pod: string,
    namespace: string,
    container: string,
    command: string[],
  ): Promise<{ stdOut: string; stdError: string }> {
    // Wait until the exec request is done and reject if the final status is a failure, otherwise
    // everything went OK and stdOutStream contains the response
    let stdOut = '';
    let stdError = '';
    const { server, opts } = this.getServerConfig();
    try {
      await new Promise<void>((resolve, reject) => {
        const k8sServer = server.replace(/^http/, 'ws');
        if (!k8sServer) {
          reject('Failed to get kubernetes client server.');
        }
        const queryStr = stringify({ stdout: true, stderr: true, command, container });
        const url = `${k8sServer}/api/v1/namespaces/${namespace}/pods/${pod}/exec?${queryStr}`;

        const client = new WebSocket(url, PROTOCOLS, opts);
        let openTimeoutObj: NodeJS.Timeout | undefined;
        let responseTimeoutObj: NodeJS.Timeout | undefined;

        client.onopen = () => {
          openTimeoutObj = setTimeout(() => {
            if (client.OPEN) {
              client.close();
            }
          }, 30000);
        };

        client.onclose = () => {
          resolve();
          if (openTimeoutObj) {
            clearTimeout(openTimeoutObj);
          }
          if (responseTimeoutObj) {
            clearTimeout(responseTimeoutObj);
          }
        };

        client.onerror = err => {
          const message = helpers.errors.getMessage(err);
          stdError += message;
          reject(message);
          client.close();
        };

        client.onmessage = event => {
          if (typeof event.data !== 'string') {
            return;
          }
          const channel = CHANNELS[parseInt(event.data[0], 8)];

          if (channel === CHANNELS[CHANNELS.STD_OUT] && event.data.length === 1) {
            if (!responseTimeoutObj) {
              responseTimeoutObj = setTimeout(() => {
                if (client.OPEN) {
                  client.close();
                }
              }, 3000);
            }
            return;
          }

          let message = Buffer.from(event.data.substr(1), 'base64').toString('utf-8');
          message = message.replace(/\n/g, ' ').trim();

          if (channel === CHANNELS[CHANNELS.STD_OUT]) {
            stdOut += message;
          } else if (channel === CHANNELS[CHANNELS.STD_ERROR]) {
            stdError += message;
          } else if (channel === CHANNELS[CHANNELS.ERROR]) {
            stdError += message;
          }
          client.close();
        };
      });
    } catch (e) {
      throw helpers.errors.getMessage(e);
    }
    return { stdOut, stdError };
  }
}
