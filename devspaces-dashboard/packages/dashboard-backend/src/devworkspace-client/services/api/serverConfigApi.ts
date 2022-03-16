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

const CUSTOM_RESOURCE_DEFINITIONS_API_ERROR_LABEL = 'CUSTOM_RESOURCE_DEFINITIONS_API_ERROR';

const GROUP = 'org.eclipse.che';
const VERSION = 'v1';
const PLURAL = 'checlusters';

const NAME = process.env.CHECLUSTER_CR_NAME;
const NAMESPACE = process.env.CHECLUSTER_CR_NAMESPACE;

export class ServerConfigApi implements IServerConfigApi {
  private readonly customObjectAPI: k8s.CustomObjectsApi;

  constructor(kc: k8s.KubeConfig) {
    this.customObjectAPI = kc.makeApiClient(k8s.CustomObjectsApi);
  }

  async getCheCustomResource(): Promise<{ [key: string]: any }> {
    if (!NAME || !NAMESPACE) {
      throw createError(
        undefined,
        CUSTOM_RESOURCE_DEFINITIONS_API_ERROR_LABEL,
        'Mandatory environment variables are not defined: $CHECLUSTER_CR_NAMESPACE, $CHECLUSTER_CR_NAME',
      );
    }

    const resp = await this.customObjectAPI.listClusterCustomObject(GROUP, VERSION, PLURAL);

    const cheCustomResource = (resp.body as any).items.find(
      (item: k8s.V1CustomResourceDefinition) =>
        item.metadata?.name === NAME && item.metadata?.namespace === NAMESPACE,
    );

    if (!cheCustomResource) {
      throw createError(
        undefined,
        CUSTOM_RESOURCE_DEFINITIONS_API_ERROR_LABEL,
        'Unable to find CheCustomResource',
      );
    }
    return cheCustomResource;
  }

  getDefaultPlugins(cheCustomResource: { [key: string]: any }): api.IWorkspacesDefaultPlugins[] {
    return cheCustomResource.spec.server.workspacesDefaultPlugins || [];
  }

  getDashboardWarning(cheCustomResource: { [key: string]: any }): string | undefined {
    return cheCustomResource.spec.dashboard?.warning;
  }

  getRunningWorkspacesLimit(cheCustomResource: { [key: string]: any }): number {
    return cheCustomResource.spec.devWorkspace.runningLimit || 1;
  }
}
