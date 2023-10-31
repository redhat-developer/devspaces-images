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

import { api } from '@eclipse-che/common';
import * as k8s from '@kubernetes/client-node';

import { createError } from '@/devworkspaceClient/services/helpers/createError';
import {
  CoreV1API,
  prepareCoreV1API,
} from '@/devworkspaceClient/services/helpers/prepareCoreV1API';
import {
  buildLabelSelector,
  fromSecret,
  isSshKeySecret,
  toSecret,
} from '@/devworkspaceClient/services/sshKeysApi/helpers';
import { IShhKeysApi } from '@/devworkspaceClient/types';

const API_ERROR_LABEL = 'CORE_V1_API_ERROR';

export class SshKeysService implements IShhKeysApi {
  private readonly coreV1API: CoreV1API;
  private readonly config: k8s.KubeConfig;

  constructor(kc: k8s.KubeConfig) {
    this.config = kc;
    this.coreV1API = prepareCoreV1API(kc);
  }

  private async listSecrets(namespace: string): Promise<k8s.V1Secret[]> {
    const labelSelector = buildLabelSelector();
    const resp = await this.coreV1API.listNamespacedSecret(
      namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      labelSelector,
    );
    return resp.body.items;
  }

  async list(namespace: string): Promise<Array<api.SshKey>> {
    try {
      const secrets = await this.listSecrets(namespace);
      return secrets
        .filter(secret => isSshKeySecret(secret))
        .map(secret => {
          return fromSecret(secret);
        });
    } catch (error) {
      const additionalMessage = `Unable to list SSH keys in the namespace "${namespace}"`;
      throw createError(error, API_ERROR_LABEL, additionalMessage);
    }
  }

  async add(namespace: string, sshKey: api.NewSshKey): Promise<api.SshKey> {
    /* check if secret is already exists */
    try {
      const secrets = await this.listSecrets(namespace);

      const existingSecret = secrets.find(secret => {
        return secret.metadata?.name === sshKey.name;
      });
      if (existingSecret !== undefined) {
        throw new Error(`SSH key already exists`);
      }
    } catch (error) {
      const additionalMessage = `Unable to add SSH key "${sshKey.name}"`;
      throw createError(error, API_ERROR_LABEL, additionalMessage);
    }

    /* create the secret */

    try {
      const secret = toSecret(namespace, sshKey);
      const { body } = await this.coreV1API.createNamespacedSecret(namespace, secret);
      return fromSecret(body);
    } catch (error) {
      const additionalMessage = `Unable to add SSH key "${sshKey.name}"`;
      throw createError(error, API_ERROR_LABEL, additionalMessage);
    }
  }

  async delete(namespace: string, name: string): Promise<void> {
    try {
      await this.coreV1API.deleteNamespacedSecret(name, namespace);
    } catch (error) {
      const additionalMessage = `Unable to delete SSH key "${name}" in the namespace "${namespace}"`;
      throw createError(error, API_ERROR_LABEL, additionalMessage);
    }
  }
}
