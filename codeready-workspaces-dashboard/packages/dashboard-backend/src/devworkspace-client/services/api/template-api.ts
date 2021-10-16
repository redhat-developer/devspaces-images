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
import { helpers } from '@eclipse-che/common';
import {
  devworkspacetemplateGroup,
  devworkspacetemplateLatestVersion,
  devworkspacetemplatePlural, V1alpha2DevWorkspaceTemplate
} from '@devfile/api';
import { IDevWorkspaceTemplateApi, } from '../../types';

export class DevWorkspaceTemplateApi implements IDevWorkspaceTemplateApi {
  private readonly customObjectAPI: k8s.CustomObjectsApi;

  constructor(kc: k8s.KubeConfig) {
    this.customObjectAPI = kc.makeApiClient(k8s.CustomObjectsApi);
  }

  async listInNamespace(namespace: string): Promise<V1alpha2DevWorkspaceTemplate[]> {
    try {
      const resp = await this.customObjectAPI.listNamespacedCustomObject(
        devworkspacetemplateGroup,
        devworkspacetemplateLatestVersion,
        namespace,
        devworkspacetemplatePlural
      );
      return (resp.body as any).items as V1alpha2DevWorkspaceTemplate[];
    } catch (e) {
      throw new Error('unable to list devworkspace templates: ' + helpers.errors.getMessage(e));
    }
  }

  async getByName(namespace: string, name: string): Promise<V1alpha2DevWorkspaceTemplate> {
    try {
      const resp = await this.customObjectAPI.getNamespacedCustomObject(
        devworkspacetemplateGroup,
        devworkspacetemplateLatestVersion,
        namespace,
        devworkspacetemplatePlural,
        name
      );
      return resp.body as V1alpha2DevWorkspaceTemplate;
    } catch (e) {
      throw new Error(`unable to get devworkspace "${namespace}/${name}": ` + helpers.errors.getMessage(e));
    }
  }

  async create(
    devworkspaceTemplate: V1alpha2DevWorkspaceTemplate,
  ): Promise<V1alpha2DevWorkspaceTemplate> {
    const namespace = devworkspaceTemplate.metadata?.namespace;
    if (!namespace) {
      throw 'namespace is missing';
    }
    try {
      const resp = await this.customObjectAPI.createNamespacedCustomObject(
        devworkspacetemplateGroup,
        devworkspacetemplateLatestVersion,
        namespace,
        devworkspacetemplatePlural,
        devworkspaceTemplate
      );
      return resp.body as V1alpha2DevWorkspaceTemplate;
    } catch (e) {
      throw new Error('unable to create DevWorkspaceTemplate: ' + helpers.errors.getMessage(e));
    }
  }

  async delete(namespace: string, name: string): Promise<void> {
    try {
      await this.customObjectAPI.deleteNamespacedCustomObject(
        devworkspacetemplateGroup,
        devworkspacetemplateLatestVersion,
        namespace,
        devworkspacetemplatePlural,
        name
      );
    } catch (e) {
      throw new Error('unable to delete devworkspace template: ' + helpers.errors.getMessage(e));
    }
  }
}
