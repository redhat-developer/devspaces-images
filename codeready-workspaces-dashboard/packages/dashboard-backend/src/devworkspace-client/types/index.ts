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

import { V1alpha2DevWorkspace, V1alpha2DevWorkspaceTemplate } from '@devfile/api';
import { api } from '@eclipse-che/common';

/**
 * Holds the methods for working with dockerconfig for devworkspace
 * which is stored in Kubernetes Secret and is annotated in DevWorkspace operator specific way.
 */
export interface IDockerConfigApi {
  /**
   * Get DockerConfig in the specified namespace
   */
  read(namespace: string): Promise<api.IDockerConfig>;

  /**
   * Replace DockerConfig in the specified namespace
   */
  update(namespace: string, dockerCfg: api.IDockerConfig): Promise<api.IDockerConfig>;
}

export interface IDevWorkspaceApi {
  /**
   * Get the DevWorkspace with given namespace in the specified namespace
   */
  getByName(namespace: string, name: string): Promise<V1alpha2DevWorkspace>;

  /**
   * Get list of devworkspaces in the given namespace
   */
  listInNamespace(namespace: string): Promise<IDevWorkspaceList>;

  /**
   * Listen to all DevWorkspaces changes in the given namespace
   * @param namespace namespace where to listen to DevWorkspaces changes
   * @param resourceVersion special mark that all changes up to a given resourceVersion have already been sent
   * @param callbacks callback will be invoked when change happens
   */
  watchInNamespace(
    namespace: string,
    resourceVersion: string,
    callbacks: IDevWorkspaceCallbacks,
  ): Promise<{ abort: () => void }>;

  /**
   * Create a devworkspace based on the specified configuration.
   */
  create(devworkspace: V1alpha2DevWorkspace): Promise<V1alpha2DevWorkspace>;

  /**
   * Updates the DevWorkspace with the given configuration
   */
  update(devworkspace: V1alpha2DevWorkspace): Promise<V1alpha2DevWorkspace>;

  /**
   * Delete the DevWorkspace with given name in the specified namespace
   */
  delete(namespace: string, name: string): Promise<void>;

  /**
   * Patches the DevWorkspace with given name in the specified namespace
   */
  patch(namespace: string, name: string, patches: api.IPatch[]): Promise<V1alpha2DevWorkspace>;
}

export interface IDevWorkspaceTemplateApi {
  listInNamespace(namespace: string): Promise<V1alpha2DevWorkspaceTemplate[]>;
  getByName(namespace: string, name: string): Promise<V1alpha2DevWorkspaceTemplate>;
  patch(
    namespace: string,
    name: string,
    patches: api.IPatch[],
  ): Promise<V1alpha2DevWorkspaceTemplate>;
  delete(namespace: string, name: string): Promise<void>;
  create(template: V1alpha2DevWorkspaceTemplate): Promise<V1alpha2DevWorkspaceTemplate>;
}

export type IDevWorkspaceCallbacks = {
  onModified: (workspace: V1alpha2DevWorkspace) => void;
  onDeleted: (workspaceId: string) => void;
  onAdded: (workspace: V1alpha2DevWorkspace) => void;
  onError: (error: string) => void;
};

export interface IDevWorkspaceClient {
  devworkspaceApi: IDevWorkspaceApi;
  templateApi: IDevWorkspaceTemplateApi;
  dockerConfigApi: IDockerConfigApi;
  isDevWorkspaceApiEnabled(): Promise<boolean>;
}

export interface IDevWorkspaceList {
  apiVersion: string;
  kind: string;
  metadata: {
    resourceVersion?: string;
  };
  items: V1alpha2DevWorkspace[];
}
