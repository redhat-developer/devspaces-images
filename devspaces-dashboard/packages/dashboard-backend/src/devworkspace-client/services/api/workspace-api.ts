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
import { IDevWorkspaceList, IDevWorkspaceApi, IDevWorkspaceCallbacks } from '../../types';
import {
  devworkspaceGroup,
  devworkspaceLatestVersion,
  devworkspacePlural,
  V1alpha2DevWorkspace,
} from '@devfile/api';

import { api } from '@eclipse-che/common';
import { createError } from '../helpers';

const DEV_WORKSPACE_API_ERROR_LABEL = 'CUSTOM_OBJECTS_API_ERROR';

export class DevWorkspaceApi implements IDevWorkspaceApi {
  private readonly customObjectAPI: k8s.CustomObjectsApi;
  private readonly customObjectWatch: k8s.Watch;

  constructor(kc: k8s.KubeConfig) {
    this.customObjectAPI = kc.makeApiClient(k8s.CustomObjectsApi);
    this.customObjectWatch = new k8s.Watch(kc);
  }

  async listInNamespace(namespace: string): Promise<IDevWorkspaceList> {
    try {
      const resp = await this.customObjectAPI.listNamespacedCustomObject(
        devworkspaceGroup,
        devworkspaceLatestVersion,
        namespace,
        devworkspacePlural,
      );
      return resp.body as IDevWorkspaceList;
    } catch (e) {
      throw createError(e, DEV_WORKSPACE_API_ERROR_LABEL, 'Unable to list devworkspaces');
    }
  }

  async getByName(namespace: string, name: string): Promise<V1alpha2DevWorkspace> {
    try {
      const resp = await this.customObjectAPI.getNamespacedCustomObject(
        devworkspaceGroup,
        devworkspaceLatestVersion,
        namespace,
        devworkspacePlural,
        name,
      );
      return resp.body as V1alpha2DevWorkspace;
    } catch (e) {
      throw createError(
        e,
        DEV_WORKSPACE_API_ERROR_LABEL,
        `Unable to get devworkspace ${namespace}/${name}`,
      );
    }
  }

  async create(devworkspace: V1alpha2DevWorkspace): Promise<V1alpha2DevWorkspace> {
    try {
      if (!devworkspace.metadata?.name || !devworkspace.metadata?.namespace) {
        throw 'DevWorkspace.metadata with name and namespace are required';
      }

      const resp = await this.customObjectAPI.createNamespacedCustomObject(
        devworkspaceGroup,
        devworkspaceLatestVersion,
        devworkspace.metadata.namespace,
        devworkspacePlural,
        devworkspace,
      );
      return resp.body as V1alpha2DevWorkspace;
    } catch (e) {
      throw createError(e, DEV_WORKSPACE_API_ERROR_LABEL, 'Unable to create devworkspace');
    }
  }

  async update(devworkspace: V1alpha2DevWorkspace): Promise<V1alpha2DevWorkspace> {
    try {
      if (!devworkspace.metadata?.name || !devworkspace.metadata?.namespace) {
        throw 'DevWorkspace.metadata with name and namespace are required';
      }

      // you have to delete some elements from the devworkspace in order to update
      if (devworkspace.metadata?.uid) {
        devworkspace.metadata.uid = undefined;
      }
      if (devworkspace.metadata?.creationTimestamp) {
        delete devworkspace.metadata.creationTimestamp;
      }
      if (devworkspace.metadata?.deletionTimestamp) {
        delete devworkspace.metadata.deletionTimestamp;
      }

      const name = devworkspace.metadata.name;
      const namespace = devworkspace.metadata.namespace;

      const resp = await this.customObjectAPI.replaceNamespacedCustomObject(
        devworkspaceGroup,
        devworkspaceLatestVersion,
        namespace,
        devworkspacePlural,
        name,
        devworkspace,
      );
      return resp.body as V1alpha2DevWorkspace;
    } catch (e) {
      throw createError(e, DEV_WORKSPACE_API_ERROR_LABEL, 'Unable to update devworkspace');
    }
  }

  async delete(namespace: string, name: string): Promise<void> {
    try {
      await this.customObjectAPI.deleteNamespacedCustomObject(
        devworkspaceGroup,
        devworkspaceLatestVersion,
        namespace,
        devworkspacePlural,
        name,
      );
    } catch (e) {
      throw createError(
        e,
        DEV_WORKSPACE_API_ERROR_LABEL,
        `Unable to delete devworkspace ${namespace}/${name}`,
      );
    }
  }

  /**
   * Patch a DevWorkspace
   */
  async patch(
    namespace: string,
    name: string,
    patches: api.IPatch[],
  ): Promise<V1alpha2DevWorkspace> {
    return this.createPatch(namespace, name, patches);
  }

  private async createPatch(namespace: string, name: string, patches: api.IPatch[]) {
    try {
      const options = {
        headers: {
          'Content-type': k8s.PatchUtils.PATCH_FORMAT_JSON_PATCH,
        },
      };
      const resp = await this.customObjectAPI.patchNamespacedCustomObject(
        devworkspaceGroup,
        devworkspaceLatestVersion,
        namespace,
        devworkspacePlural,
        name,
        patches,
        undefined,
        undefined,
        undefined,
        options,
      );
      return resp.body as V1alpha2DevWorkspace;
    } catch (e) {
      throw createError(e, DEV_WORKSPACE_API_ERROR_LABEL, 'Unable to patch devworkspace');
    }
  }

  async watchInNamespace(
    namespace: string,
    resourceVersion: string,
    callbacks: IDevWorkspaceCallbacks,
  ): Promise<{ abort: () => void }> {
    const path = `/apis/${devworkspaceGroup}/${devworkspaceLatestVersion}/watch/namespaces/${namespace}/${devworkspacePlural}`;
    const queryParams = { watch: true, resourceVersion };

    return this.customObjectWatch.watch(
      path,
      queryParams,
      (type: string, devworkspace: V1alpha2DevWorkspace) => {
        if (type === 'ADDED') {
          callbacks.onAdded(devworkspace);
        } else if (type === 'MODIFIED') {
          callbacks.onModified(devworkspace);
        } else if (type === 'DELETED') {
          const workspaceId = devworkspace?.status?.devworkspaceId;
          if (workspaceId) {
            callbacks.onDeleted(workspaceId);
          } else {
            // workspace does not have id yet, means it's not processed by DWO yet
          }
        } else if (type === 'ERROR') {
          callbacks.onError('Error: Unknown error.');
        } else {
          callbacks.onError(`Error: Unknown type '${type}'.`);
        }
      },
      (error: any) => {
        let message;
        if (error && error.message) {
          message = error.message;
        } else {
          // unexpected error format. Log it and expose to user what we can
          console.log('Unexpected error', error);
          if (error) {
            message = error.toString();
          }
          if (!message) {
            message = 'unknown. Contact admin to check server logs';
          }
        }
        callbacks.onError(`Error: ${message}`);
      },
    );
  }
}
