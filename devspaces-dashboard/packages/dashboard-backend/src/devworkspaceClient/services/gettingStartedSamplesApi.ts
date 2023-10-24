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
import { V1ConfigMapList } from '@kubernetes/client-node/dist/gen/model/v1ConfigMapList';
import http from 'http';

import { createError } from '@/devworkspaceClient/services/helpers/createError';
import { getIcon } from '@/devworkspaceClient/services/helpers/getSampleIcon';
import {
  CoreV1API,
  prepareCoreV1API,
} from '@/devworkspaceClient/services/helpers/prepareCoreV1API';
import { IGettingStartedSampleApi } from '@/devworkspaceClient/types';
import { logger } from '@/utils/logger';

const API_ERROR_LABEL = 'CORE_V1_API_ERROR';
const DEVFILE_METADATA_LABEL_SELECTOR =
  'app.kubernetes.io/component=getting-started-samples,app.kubernetes.io/part-of=che.eclipse.org';

export class GettingStartedSamplesApiService implements IGettingStartedSampleApi {
  private readonly coreV1API: CoreV1API;
  constructor(kubeConfig: k8s.KubeConfig) {
    this.coreV1API = prepareCoreV1API(kubeConfig);
  }

  private get env(): { NAMESPACE?: string } {
    return {
      NAMESPACE: process.env.CHECLUSTER_CR_NAMESPACE,
    };
  }

  async list(): Promise<Array<api.IGettingStartedSample>> {
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
        DEVFILE_METADATA_LABEL_SELECTOR,
      );
    } catch (error) {
      const additionalMessage = 'Unable to list getting started samples ConfigMap';
      throw createError(error, API_ERROR_LABEL, additionalMessage);
    }

    const samples: api.IGettingStartedSample[] = [];

    for (const cm of response.body.items) {
      if (cm.data === undefined) {
        continue;
      }

      for (const key in cm.data) {
        try {
          const sample = JSON.parse(cm.data[key]);
          Array.isArray(sample) ? samples.push(...sample) : samples.push(sample);
        } catch (error) {
          logger.error(error, 'Failed to parse getting started sample: %s', cm.data[key]);
        }
      }
    }

    // Ensure icon for each sample
    samples.forEach(sample => (sample.icon = getIcon(sample)));

    return samples;
  }
}
