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

import { V220DevfileComponents } from '@devfile/api';
import { api } from '@eclipse-che/common';
import * as k8s from '@kubernetes/client-node';
import { IServerConfigApi } from '../types';
import { createError } from './helpers/createError';

export type CustomResourceDefinitionList = k8s.V1CustomResourceDefinitionList & {
  items?: CustomResourceDefinition[];
};
export type CustomResourceDefinition = k8s.V1CustomResourceDefinition & {
  spec: {
    devEnvironments?: {
      defaultComponents?: V220DevfileComponents[];
      defaultEditor?: string;
      defaultPlugins?: api.IWorkspacesDefaultPlugins[];
      secondsOfRunBeforeIdling?: number;
      secondsOfInactivityBeforeIdling?: number;
      storage?: {
        pvcStrategy?: string;
      };
    };
    components?: {
      dashboard?: {
        headerMessage?: {
          show?: boolean;
          text?: string;
        };
      };
      devWorkspace?: {
        runningLimit?: number;
      };
      pluginRegistry?: {
        openVSXURL?: string;
      };
    };
  };
};

const CUSTOM_RESOURCE_DEFINITIONS_API_ERROR_LABEL = 'CUSTOM_RESOURCE_DEFINITIONS_API_ERROR';

const GROUP = 'org.eclipse.che';
const VERSION = 'v2';
const PLURAL = 'checlusters';

export class ServerConfigApiService implements IServerConfigApi {
  private readonly customObjectAPI: k8s.CustomObjectsApi;

  constructor(kc: k8s.KubeConfig) {
    this.customObjectAPI = kc.makeApiClient(k8s.CustomObjectsApi);
  }

  private get env(): { NAME?: string; NAMESPACE?: string } {
    return {
      NAME: process.env.CHECLUSTER_CR_NAME,
      NAMESPACE: process.env.CHECLUSTER_CR_NAMESPACE,
    };
  }

  async getCheCustomResource(): Promise<CustomResourceDefinition> {
    if (!this.env.NAME || !this.env.NAMESPACE) {
      throw createError(
        undefined,
        CUSTOM_RESOURCE_DEFINITIONS_API_ERROR_LABEL,
        'Mandatory environment variables are not defined: $CHECLUSTER_CR_NAMESPACE, $CHECLUSTER_CR_NAME',
      );
    }

    const { body } = await this.customObjectAPI.listClusterCustomObject(GROUP, VERSION, PLURAL);

    const customResourceDefinitionsList = body as CustomResourceDefinitionList;

    const cheCustomResource = customResourceDefinitionsList.items?.find(
      (item: CustomResourceDefinition) =>
        item.metadata?.name === this.env.NAME && item.metadata?.namespace === this.env.NAMESPACE,
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

  getDefaultPlugins(cheCustomResource: CustomResourceDefinition): api.IWorkspacesDefaultPlugins[] {
    return cheCustomResource.spec.devEnvironments?.defaultPlugins || [];
  }

  getDefaultEditor(cheCustomResource: CustomResourceDefinition): string | undefined {
    return cheCustomResource.spec.devEnvironments?.defaultEditor;
  }

  getDefaultComponents(cheCustomResource: CustomResourceDefinition): V220DevfileComponents[] {
    return cheCustomResource.spec.devEnvironments?.defaultComponents || [];
  }

  getOpenVSXURL(cheCustomResource: CustomResourceDefinition): string {
    return cheCustomResource.spec.components?.pluginRegistry?.openVSXURL || '';
  }

  getPvcStrategy(cheCustomResource: CustomResourceDefinition): string | undefined {
    return cheCustomResource.spec.devEnvironments?.storage?.pvcStrategy;
  }

  getDashboardWarning(cheCustomResource: CustomResourceDefinition): string | undefined {
    if (!cheCustomResource.spec.components?.dashboard?.headerMessage?.show) {
      return undefined;
    }
    return cheCustomResource.spec.components?.dashboard?.headerMessage?.text;
  }

  getRunningWorkspacesLimit(cheCustomResource: CustomResourceDefinition): number {
    return cheCustomResource.spec.components?.devWorkspace?.runningLimit || 1;
  }

  getWorkspaceInactivityTimeout(cheCustomResource: CustomResourceDefinition): number {
    return cheCustomResource.spec.devEnvironments?.secondsOfInactivityBeforeIdling || -1;
  }

  getWorkspaceRunTimeout(cheCustomResource: CustomResourceDefinition): number {
    return cheCustomResource.spec.devEnvironments?.secondsOfRunBeforeIdling || -1;
  }
}
