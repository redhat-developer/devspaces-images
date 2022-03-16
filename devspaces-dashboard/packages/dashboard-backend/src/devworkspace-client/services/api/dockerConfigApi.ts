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
import { IDockerConfigApi } from '../../types';
import { V1Secret } from '@kubernetes/client-node/dist/gen/model/v1Secret';
import { api } from '@eclipse-che/common';
import { createError } from '../helpers';
import { helpers } from '@eclipse-che/common';

const SECRET_KEY = '.dockerconfigjson';
const SECRET_NAME = 'devworkspace-container-registry-dockercfg';
const SECRET_LABELS = { 'controller.devfile.io/devworkspace_pullsecret': 'true' };
const DOCKER_CONFIG_API_ERROR_LABEL = 'CORE_V1_API_ERROR';

export class DockerConfigApi implements IDockerConfigApi {
  private readonly coreV1API: k8s.CoreV1Api;

  constructor(kc: k8s.KubeConfig) {
    this.coreV1API = kc.makeApiClient(k8s.CoreV1Api);
  }

  async read(namespace: string): Promise<api.IDockerConfig> {
    try {
      const { body } = await this.coreV1API.readNamespacedSecret(SECRET_NAME, namespace);
      return this.toDockerConfig(body);
    } catch (error) {
      if (helpers.errors.isKubeClientError(error) && error.statusCode === 404) {
        return this.toDockerConfig();
      }

      const additionalMessage = `Unable to read dockerConfig in the specified namespace "${namespace}"`;
      throw createError(error, DOCKER_CONFIG_API_ERROR_LABEL, additionalMessage);
    }
  }

  async update(namespace: string, dockerCfg: api.IDockerConfig): Promise<api.IDockerConfig> {
    try {
      let secret: V1Secret | undefined;
      try {
        const resp = await this.coreV1API.readNamespacedSecret(SECRET_NAME, namespace);
        secret = resp.body;
      } catch (e) {
        if (helpers.errors.isKubeClientError(e) && e.statusCode === 404) {
          const dockerConfigSecret = this.toDockerConfigSecret(dockerCfg);
          const { body } = await this.coreV1API.createNamespacedSecret(
            namespace,
            dockerConfigSecret,
          );
          return this.toDockerConfig(body);
        }
        throw e;
      }
      this.updateDockerConfigSecret(secret, dockerCfg);
      const { body } = await this.coreV1API.replaceNamespacedSecret(SECRET_NAME, namespace, secret);
      return this.toDockerConfig(body);
    } catch (error) {
      const additionalMessage = `Unable to update dockerConfig in the specified namespace "${namespace}"`;
      throw createError(error, DOCKER_CONFIG_API_ERROR_LABEL, additionalMessage);
    }
  }

  private toDockerConfigSecret(dockerCfg: api.IDockerConfig): V1Secret {
    return {
      apiVersion: 'v1',
      data: {
        [SECRET_KEY]: dockerCfg.dockerconfig || '',
      },
      kind: 'Secret',
      metadata: {
        name: SECRET_NAME,
        labels: SECRET_LABELS,
      },
      type: 'kubernetes.io/dockerconfigjson',
    };
  }

  private getDockerConfig(secret?: V1Secret): string | undefined {
    return secret?.data?.[SECRET_KEY];
  }

  private toDockerConfig(secret?: V1Secret): api.IDockerConfig {
    const dockerconfig = this.getDockerConfig(secret);
    const resourceVersion = secret?.metadata?.resourceVersion;

    return { dockerconfig, resourceVersion };
  }

  private updateDockerConfigSecret(secret: V1Secret, dockerCfg: api.IDockerConfig): void {
    if (!secret.metadata) {
      secret.metadata = {};
    }
    secret.data = { [SECRET_KEY]: dockerCfg.dockerconfig || '' };
    secret.metadata.labels = SECRET_LABELS;
    if (dockerCfg.resourceVersion) {
      secret.metadata.resourceVersion = dockerCfg.resourceVersion;
    }
  }
}
