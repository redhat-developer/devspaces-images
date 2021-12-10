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
import { IServerConfigApi } from '../../types';
import { createError } from '../helpers';
import { api } from '@eclipse-che/common';

const CUSTOM_RECOURSE_DEFINITIONS_API_ERROR_LABEL = 'CUSTOM_RESOURSE_DEFINITIONS_API_ERROR';

const GROUP = 'org.eclipse.che';
const VERSION = 'v1';
const PLURAL = 'checlusters';

const NAME = process.env.CHE_CRD_OBJECT_NAME;
const NAMESPACE = process.env.CHE_NAMESPACE;

export class ServerConfigApi implements IServerConfigApi {
  private readonly customObjectAPI: k8s.CustomObjectsApi;

  constructor(kc: k8s.KubeConfig) {
    this.customObjectAPI = kc.makeApiClient(k8s.CustomObjectsApi);
  }

  async getDefaultPlugins(): Promise<api.IWorkspacesDefaultPlugins[]> {
    if (!NAME || !NAMESPACE) {
      throw createError(
        undefined,
        CUSTOM_RECOURSE_DEFINITIONS_API_ERROR_LABEL,
        'Mandatory environment variables are not defined: $CHE_NAMESPACE, $CHE_CRD_OBJECT_NAME',
      );
    }

    try {
      const resp = await this.customObjectAPI.listClusterCustomObject(GROUP, VERSION, PLURAL);

      const cheCustomResource = (resp.body as any).items.find(
        (item: k8s.V1CustomResourceDefinition) =>
          item.metadata?.name === NAME && item.metadata?.namespace === NAMESPACE,
      );

      if (!cheCustomResource) {
        throw createError(
          undefined,
          CUSTOM_RECOURSE_DEFINITIONS_API_ERROR_LABEL,
          'Unable to find CheCustomResource',
        );
      }
      return cheCustomResource.spec.server.workspacesDefaultPlugins || [];
    } catch (e) {
      throw createError(
        e,
        CUSTOM_RECOURSE_DEFINITIONS_API_ERROR_LABEL,
        'Unable to fetch listClusterCustomObject',
      );
    }
  }
}
