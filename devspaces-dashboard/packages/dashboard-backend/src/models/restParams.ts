/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
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

export interface ISchemaParams {
  [key: string]: unknown;
}

export interface ITemplateBodyParams {
  template: V1alpha2DevWorkspaceTemplate;
}

export interface IDevWorkspaceSpecParams {
  devworkspace: V1alpha2DevWorkspace;
}

export interface IYamlResolverParams {
  url: string;
}

export interface IWorkspacePreferencesParams {
  namespace: string;
  provider: api.GitProvider;
}

export interface IDockerConfigParams {
  dockerconfig: string;
  resourceVersion?: string;
}

export interface IEditorsDevfileParams {
  'che-editor': string;
}

// --- Namespaced Params ---
export interface INamespacedParams {
  namespace: string;
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

export interface PersonalAccessTokenNamespacedParams extends INamespacedParams {
  tokenName: string;
}

export interface ShhKeyNamespacedParams extends INamespacedParams {
  name: string;
}
