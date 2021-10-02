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
import { devWorkspaceApiGroup, devworkspaceTemplateSubresource, devworkspaceVersion } from '../../const';
import { IDevWorkspaceTemplate, IDevWorkspaceTemplateApi, } from '../../types';

export class DevWorkspaceTemplateApi implements IDevWorkspaceTemplateApi {
  private readonly customObjectAPI: k8s.CustomObjectsApi;

  constructor(kc: k8s.KubeConfig) {
    this.customObjectAPI = kc.makeApiClient(k8s.CustomObjectsApi);
  }

  async listInNamespace(namespace: string): Promise<IDevWorkspaceTemplate[]> {
    try {
      const resp = await this.customObjectAPI.listNamespacedCustomObject(
        devWorkspaceApiGroup,
        devworkspaceVersion,
        namespace,
        devworkspaceTemplateSubresource
      );
      return (resp.body as any).items as IDevWorkspaceTemplate[];
    } catch (e) {
      throw new Error('unable to list devworkspace templates: ' + helpers.errors.getMessage(e));
    }
  }

  async getByName(namespace: string, name: string): Promise<IDevWorkspaceTemplate> {
    try {
      const resp = await this.customObjectAPI.getNamespacedCustomObject(
        devWorkspaceApiGroup,
        devworkspaceVersion,
        namespace,
        devworkspaceTemplateSubresource,
        name
      );
      return resp.body as IDevWorkspaceTemplate;
    } catch (e) {
      throw new Error(`unable to get devworkspace "${namespace}/${name}": ` + helpers.errors.getMessage(e));
    }
  }

  async create(
    devworkspaceTemplate: IDevWorkspaceTemplate,
  ): Promise<IDevWorkspaceTemplate> {
    const namespace = devworkspaceTemplate.metadata?.namespace;
    if (!namespace) {
      throw 'namespace is missing';
    }
    try {
      const resp = await this.customObjectAPI.createNamespacedCustomObject(
        devWorkspaceApiGroup,
        devworkspaceVersion,
        namespace,
        devworkspaceTemplateSubresource,
        devworkspaceTemplate
      );
      return resp.body as IDevWorkspaceTemplate;
    } catch (e) {
      throw new Error('unable to create DevWorkspaceTemplate: ' + helpers.errors.getMessage(e));
    }
  }

  async delete(namespace: string, name: string): Promise<void> {
    try {
      await this.customObjectAPI.deleteNamespacedCustomObject(
        devWorkspaceApiGroup,
        devworkspaceVersion,
        namespace,
        devworkspaceTemplateSubresource,
        name
      );
    } catch (e) {
      throw new Error('unable to delete devworkspace template: ' + helpers.errors.getMessage(e));
    }
  }
}
