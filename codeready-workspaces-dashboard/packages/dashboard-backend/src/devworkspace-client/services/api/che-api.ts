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
import { ICheApi, } from '../../types';
import { projectApiGroup, projectRequestResources, projectResources, } from '../../const';
import { namespaceModel, projectRequestModel } from '../../const/models';
import { findApi } from '../helpers';
import { helpers } from '@eclipse-che/common';

/**
 * @deprecated Che Server started to provide rest endpoint to get namespace prepared.
 * See for details https://github.com/eclipse/che/issues/20167
 */
export class CheApi implements ICheApi {
  private readonly customObjectAPI: k8s.CustomObjectsApi;
  private readonly coreV1API: k8s.CoreV1Api;
  private readonly apisApi: k8s.ApisApi;

  constructor(kc: k8s.KubeConfig) {
    this.customObjectAPI = kc.makeApiClient(k8s.CustomObjectsApi);
    this.coreV1API = kc.makeApiClient(k8s.CoreV1Api);
    this.apisApi = kc.makeApiClient(k8s.ApisApi);
  }

  async initializeNamespace(namespace: string): Promise<void> {
    try {
      const isOpenShift = await this.isOpenShift();
      if (isOpenShift) {
        const doesProjectAlreadyExist = await this.doesProjectExist(namespace);
        if (!doesProjectAlreadyExist) {
          await this.createProject(namespace);
        }
      } else {
        const doesNamespaceExist = await this.doesNamespaceExist(namespace);
        if (!doesNamespaceExist) {
          await this.createNamespace(namespace);
        }
      }
    } catch (e) {
      throw new Error('unable to init project: ' + helpers.errors.getMessage(e));
    }
  }

  async doesProjectExist(projectName: string): Promise<boolean> {
    try {
      const resp = await this.customObjectAPI.listClusterCustomObject(projectApiGroup, 'v1', projectResources);
      const projectList = (resp.body as any).items;
      return (
        projectList.filter((x: any) => x.metadata.name === projectName)
          .length > 0
      );
    } catch (e) {
      return false;
    }
  }

  async doesNamespaceExist(namespace: string): Promise<boolean> {
    try {
      await this.coreV1API.readNamespace(namespace);
      // namespace is fetched, so it exists
      return true;
    } catch (e) {
      return false;
    }
  }

  async isOpenShift(): Promise<boolean> {
    try {
      return findApi(this.apisApi, projectApiGroup);
    } catch (e) {
      return false;
    }
  }

  private async createProject(namespace: string): Promise<void> {
    try {
      await this.customObjectAPI.createClusterCustomObject(
        projectApiGroup,
        'v1',
        projectRequestResources,
        projectRequestModel(namespace)
      );
    } catch (e) {
      throw new Error('unable to create project: ' + helpers.errors.getMessage(e));
    }
  }

  private async createNamespace(namespace: string): Promise<void> {
    try {
      await this.coreV1API.createNamespace(
        namespaceModel(namespace)
      );
    } catch (e) {
      throw new Error('unable to create namespace: ' + helpers.errors.getMessage(e));
    }
  }
}
