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

import { V1alpha2DevWorkspace, V1alpha2DevWorkspaceTemplate } from '@devfile/api';

export interface INamespacedParams {
  namespace: string;
}

export interface IDockerConfigParams {
  dockerconfig: string;
  resourceVersion?: string;
}

export interface INamespacedWorkspaceParams extends INamespacedParams {
  workspaceName: string;
}

export interface INamespacedTemplateParams extends INamespacedParams {
  templateName: string;
}

export interface INamespacedPodParams extends INamespacedParams {
  devworkspaceId: string;
}

export interface ISchemaParams {
  [key: string]: unknown;
}

export interface ITemplateBodyParams {
  template: V1alpha2DevWorkspaceTemplate;
}

export interface IDevWorkspaceSpecParams {
  devworkspace: V1alpha2DevWorkspace;
}

export interface IDevfileVersionParams {
  version: string;
}

export interface IYamlResolverParams {
  url: string;
}

export interface INamespacedContainerParams extends INamespacedParams {
  containerName: string;
  namespace: string;
  podName: string;
}

export interface PersonalAccessTokenNamespacedParams extends INamespacedParams {
  namespace: string;
  tokenName: string;
}

export interface ShhKeyNamespacedParams extends INamespacedParams {
  namespace: string;
  name: string;
}
