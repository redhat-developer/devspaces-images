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

import { V222Devfile } from '@devfile/api';
import { V1ConfigMapList } from '@kubernetes/client-node/dist/gen/model/v1ConfigMapList';
import http from 'http';
import * as yaml from 'js-yaml';

import { createError } from '@/devworkspaceClient/services/helpers/createError';
import {
  CoreV1API,
  prepareCoreV1API,
} from '@/devworkspaceClient/services/helpers/prepareCoreV1API';
import { IEditorsApi } from '@/devworkspaceClient/types';
import { KubeConfigProvider } from '@/services/kubeclient/kubeConfigProvider';
import { logger } from '@/utils/logger';

const API_ERROR_LABEL = 'CORE_V1_API_ERROR';
const EDITOR_METADATA_LABEL_SELECTOR =
  'app.kubernetes.io/component=editor-definition,app.kubernetes.io/part-of=che.eclipse.org';

export class EditorNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EditorNotFoundError';
  }
}

export class EditorsApiService implements IEditorsApi {
  private readonly coreV1API: CoreV1API;
  constructor() {
    const kubeConfigProvider = new KubeConfigProvider();
    const kubeConfig = kubeConfigProvider.getSAKubeConfig();

    this.coreV1API = prepareCoreV1API(kubeConfig);
  }

  private get env(): { NAMESPACE?: string } {
    return {
      NAMESPACE: process.env.CHECLUSTER_CR_NAMESPACE,
    };
  }

  async list(): Promise<V222Devfile[]> {
    if (!this.env.NAMESPACE) {
      logger.warn('Mandatory environment variables are not defined: $CHECLUSTER_CR_NAMESPACE');
      return [];
    }

    let response: { response: http.IncomingMessage; body: V1ConfigMapList };
    try {
      response = await this.coreV1API.listNamespacedConfigMap(
        this.env.NAMESPACE,
        undefined,
        undefined,
        undefined,
        undefined,
        EDITOR_METADATA_LABEL_SELECTOR,
      );
    } catch (error) {
      const additionalMessage = 'Unable to list editors ConfigMap';
      throw createError(error, API_ERROR_LABEL, additionalMessage);
    }

    const editors: V222Devfile[] = [];

    for (const cm of response.body.items) {
      if (cm.data === undefined) {
        continue;
      }

      for (const key in cm.data) {
        try {
          const editor = yaml.load(cm.data[key]) as V222Devfile;
          editors.push(editor);
        } catch (error) {
          logger.error(
            error,
            'Failed to parse editor: %s from %s Config Map',
            key,
            cm.metadata?.name,
          );
        }
      }
    }

    return editors;
  }

  async get(id: string): Promise<V222Devfile> {
    const editors = await this.list();
    const matches = editors.filter(editor => {
      const currId =
        editor.metadata?.attributes.publisher +
        '/' +
        editor.metadata?.name +
        '/' +
        editor.metadata?.attributes.version;

      return currId === id;
    });
    if (matches.length === 0) {
      throw new EditorNotFoundError(`Editor with id: '${id}' not found`);
    }
    return matches[0];
  }
}
