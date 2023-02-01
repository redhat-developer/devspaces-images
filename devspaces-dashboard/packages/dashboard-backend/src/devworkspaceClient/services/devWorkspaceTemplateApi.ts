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

import * as k8s from '@kubernetes/client-node';
import {
  devworkspacetemplateGroup,
  devworkspacetemplateLatestVersion,
  devworkspacetemplatePlural,
  V1alpha2DevWorkspaceTemplate,
} from '@devfile/api';
import { IDevWorkspaceTemplateApi } from '../types';
import { createError } from './helpers/createError';
import { api } from '@eclipse-che/common';
import { CustomObjectAPI, prepareCustomObjectAPI } from './helpers/prepareCustomObjectAPI';

export type DevWorkspaceTemplateList = {
  items?: V1alpha2DevWorkspaceTemplate[];
  [key: string]: unknown;
};

const DEW_WORKSPACE_TEMPLATE_API_ERROR_LABEL = 'CUSTOM_OBJECTS_API_ERROR';

export class DevWorkspaceTemplateApiService implements IDevWorkspaceTemplateApi {
  private readonly customObjectAPI: CustomObjectAPI;

  constructor(kc: k8s.KubeConfig) {
    this.customObjectAPI = prepareCustomObjectAPI(kc);
  }

  async listInNamespace(namespace: string): Promise<V1alpha2DevWorkspaceTemplate[]> {
    try {
      const resp = await this.customObjectAPI.listNamespacedCustomObject(
        devworkspacetemplateGroup,
        devworkspacetemplateLatestVersion,
        namespace,
        devworkspacetemplatePlural,
      );
      return (resp.body as DevWorkspaceTemplateList).items as V1alpha2DevWorkspaceTemplate[];
    } catch (e) {
      throw createError(
        e,
        DEW_WORKSPACE_TEMPLATE_API_ERROR_LABEL,
        'Unable to list devworkspace templates',
      );
    }
  }

  async getByName(namespace: string, name: string): Promise<V1alpha2DevWorkspaceTemplate> {
    try {
      const resp = await this.customObjectAPI.getNamespacedCustomObject(
        devworkspacetemplateGroup,
        devworkspacetemplateLatestVersion,
        namespace,
        devworkspacetemplatePlural,
        name,
      );
      return resp.body as V1alpha2DevWorkspaceTemplate;
    } catch (e) {
      throw createError(
        e,
        DEW_WORKSPACE_TEMPLATE_API_ERROR_LABEL,
        `Unable to get devworkspace "${namespace}/${name}"`,
      );
    }
  }

  async create(
    devworkspaceTemplate: V1alpha2DevWorkspaceTemplate,
  ): Promise<V1alpha2DevWorkspaceTemplate> {
    const namespace = devworkspaceTemplate.metadata?.namespace;
    if (!namespace) {
      throw new Error('namespace is missing');
    }
    try {
      const resp = await this.customObjectAPI.createNamespacedCustomObject(
        devworkspacetemplateGroup,
        devworkspacetemplateLatestVersion,
        namespace,
        devworkspacetemplatePlural,
        devworkspaceTemplate,
      );
      return resp.body as V1alpha2DevWorkspaceTemplate;
    } catch (e) {
      throw createError(
        e,
        DEW_WORKSPACE_TEMPLATE_API_ERROR_LABEL,
        'Unable to create DevWorkspaceTemplate',
      );
    }
  }

  /**
   * Patch a template
   */
  async patch(
    namespace: string,
    templateName: string,
    patches: api.IPatch[],
  ): Promise<V1alpha2DevWorkspaceTemplate> {
    try {
      const options = {
        headers: {
          'Content-type': k8s.PatchUtils.PATCH_FORMAT_JSON_PATCH,
        },
      };
      const resp = await this.customObjectAPI.patchNamespacedCustomObject(
        devworkspacetemplateGroup,
        devworkspacetemplateLatestVersion,
        namespace,
        devworkspacetemplatePlural,
        templateName,
        patches,
        undefined,
        undefined,
        undefined,
        options,
      );
      return resp.body as V1alpha2DevWorkspaceTemplate;
    } catch (e) {
      throw createError(e, DEW_WORKSPACE_TEMPLATE_API_ERROR_LABEL, 'Unable to patch template');
    }
  }

  async delete(namespace: string, name: string): Promise<void> {
    try {
      await this.customObjectAPI.deleteNamespacedCustomObject(
        devworkspacetemplateGroup,
        devworkspacetemplateLatestVersion,
        namespace,
        devworkspacetemplatePlural,
        name,
      );
    } catch (e) {
      throw createError(
        e,
        DEW_WORKSPACE_TEMPLATE_API_ERROR_LABEL,
        'Unable to delete devworkspace template',
      );
    }
  }
}
