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

import { V221DevfileComponents } from '@devfile/api';
import { api } from '@eclipse-che/common';
import * as k8s from '@kubernetes/client-node';
import {
  CustomResourceDefinition,
  CustomResourceDefinitionList,
  CustomResourceDefinitionSpecDevEnvironments,
  IServerConfigApi,
} from '../types';
import { createError } from './helpers/createError';
import { CustomObjectAPI, prepareCustomObjectAPI } from './helpers/prepareCustomObjectAPI';
import { startTimeoutSeconds } from '../../constants/server-config';

const CUSTOM_RESOURCE_DEFINITIONS_API_ERROR_LABEL = 'CUSTOM_RESOURCE_DEFINITIONS_API_ERROR';

const GROUP = 'org.eclipse.che';
const VERSION = 'v2';
const PLURAL = 'checlusters';

export class ServerConfigApiService implements IServerConfigApi {
  private readonly customObjectAPI: CustomObjectAPI;

  constructor(kc: k8s.KubeConfig) {
    this.customObjectAPI = prepareCustomObjectAPI(kc);
  }

  private get env(): { NAME?: string; NAMESPACE?: string } {
    return {
      NAME: process.env.CHECLUSTER_CR_NAME,
      NAMESPACE: process.env.CHECLUSTER_CR_NAMESPACE,
    };
  }

  async fetchCheCustomResource(): Promise<CustomResourceDefinition> {
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

  getContainerBuild(
    cheCustomResource: CustomResourceDefinition,
  ): Pick<
    CustomResourceDefinitionSpecDevEnvironments,
    'containerBuildConfiguration' | 'disableContainerBuildCapabilities'
  > {
    const { devEnvironments } = cheCustomResource.spec;
    const disableContainerBuildCapabilitiesEnvVar =
      process.env['CHE_DEFAULT_SPEC_DEVENVIRONMENTS_DISABLECONTAINERBUILDCAPABILITIES'];

    // `defaultDisableContainerBuildCapabilities` is true if the env var is undefined or is not equal to 'false'
    const defaultDisableContainerBuildCapabilities =
      disableContainerBuildCapabilitiesEnvVar === undefined ||
      disableContainerBuildCapabilitiesEnvVar.toLowerCase() !== 'false';
    return {
      containerBuildConfiguration: devEnvironments?.containerBuildConfiguration,
      disableContainerBuildCapabilities:
        devEnvironments?.disableContainerBuildCapabilities !== undefined
          ? devEnvironments?.disableContainerBuildCapabilities
          : defaultDisableContainerBuildCapabilities,
    };
  }

  getDefaultPlugins(cheCustomResource: CustomResourceDefinition): api.IWorkspacesDefaultPlugins[] {
    return cheCustomResource.spec.devEnvironments?.defaultPlugins || [];
  }

  getDefaultEditor(cheCustomResource: CustomResourceDefinition): string | undefined {
    return (
      cheCustomResource.spec.devEnvironments?.defaultEditor ||
      process.env['CHE_DEFAULT_SPEC_DEVENVIRONMENTS_DEFAULTEDITOR']
    );
  }

  getDefaultComponents(cheCustomResource: CustomResourceDefinition): V221DevfileComponents[] {
    if (cheCustomResource.spec.devEnvironments?.defaultComponents) {
      return cheCustomResource.spec.devEnvironments.defaultComponents;
    }

    if (process.env['CHE_DEFAULT_SPEC_DEVENVIRONMENTS_DEFAULTCOMPONENTS']) {
      try {
        return JSON.parse(process.env['CHE_DEFAULT_SPEC_DEVENVIRONMENTS_DEFAULTCOMPONENTS']);
      } catch (e) {
        console.error(
          `Unable to parse default components from environment variable CHE_DEFAULT_SPEC_DEVENVIRONMENTS_DEFAULTCOMPONENTS: ${e}`,
        );
      }
    }

    return [];
  }

  getOpenVSXURL(cheCustomResource: CustomResourceDefinition): string {
    // Undefined and empty value are treated in a different ways:
    //   - empty value forces to use embedded registry
    //   - undefined value means that the default value should be used
    if (cheCustomResource.spec.components?.pluginRegistry?.openVSXURL !== undefined) {
      return cheCustomResource.spec.components.pluginRegistry.openVSXURL;
    }

    return process.env['CHE_DEFAULT_SPEC_COMPONENTS_PLUGINREGISTRY_OPENVSXURL'] || '';
  }

  getPvcStrategy(cheCustomResource: CustomResourceDefinition): string | undefined {
    return cheCustomResource.spec.devEnvironments?.storage?.pvcStrategy;
  }

  getDashboardWarning(cheCustomResource: CustomResourceDefinition): string | undefined {
    // Return the message if it is defined and the show flag is true
    if (cheCustomResource.spec.components?.dashboard?.headerMessage?.text) {
      return cheCustomResource.spec.components?.dashboard?.headerMessage?.show
        ? cheCustomResource.spec.components.dashboard.headerMessage.text
        : undefined;
    }

    // Return default message independently of the show flag.
    return process.env['CHE_DEFAULT_SPEC_COMPONENTS_DASHBOARD_HEADERMESSAGE_TEXT'];
  }

  // getRunningWorkspacesLimit return the maximum number of running workspaces.
  // See https://github.com/eclipse-che/che-operator/pull/1585 for details.
  getRunningWorkspacesLimit(cheCustomResource: CustomResourceDefinition): number {
    return (
      cheCustomResource.spec.devEnvironments?.maxNumberOfRunningWorkspacesPerUser ||
      cheCustomResource.spec.components?.devWorkspace?.runningLimit ||
      1
    );
  }

  getAllWorkspacesLimit(cheCustomResource: CustomResourceDefinition): number {
    return cheCustomResource.spec.devEnvironments?.maxNumberOfWorkspacesPerUser || -1;
  }

  getWorkspaceInactivityTimeout(cheCustomResource: CustomResourceDefinition): number {
    return cheCustomResource.spec.devEnvironments?.secondsOfInactivityBeforeIdling || -1;
  }

  getWorkspaceRunTimeout(cheCustomResource: CustomResourceDefinition): number {
    return cheCustomResource.spec.devEnvironments?.secondsOfRunBeforeIdling || -1;
  }

  getWorkspaceStartTimeout(cheCustomResource: CustomResourceDefinition): number {
    return cheCustomResource.spec.devEnvironments?.startTimeoutSeconds || startTimeoutSeconds;
  }
}
