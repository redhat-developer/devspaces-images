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

import { V1alpha2DevWorkspaceSpecTemplate } from '@devfile/api';

export const DEVWORKSPACE_CONFIG_ATTR = 'controller.devfile.io/devworkspace-config';
export const DEVWORKSPACE_CONTAINER_BUILD_ATTR = 'controller.devfile.io/scc';
export const DEVWORKSPACE_DEPLOYMENT_ATTR = 'controller.devfile.io/deployment-annotations';
export const DEVWORKSPACE_DEPLOYMENT_LABEL_ATTR = 'controller.devfile.io/deployment-labels';
export const DEVWORKSPACE_STORAGE_TYPE_ATTR = 'controller.devfile.io/storage-type';

export type DevWorkspaceSpecTemplateAttribute = {
  [DEVWORKSPACE_CONTAINER_BUILD_ATTR]?: string;
  [DEVWORKSPACE_STORAGE_TYPE_ATTR]?: string;
  [DEVWORKSPACE_DEPLOYMENT_LABEL_ATTR]?: string;
  [DEVWORKSPACE_DEPLOYMENT_ATTR]?: string;
  [DEVWORKSPACE_CONFIG_ATTR]?: unknown;
} & {
  [attr: string]: unknown;
};

export type DevWorkspaceSpecTemplate = V1alpha2DevWorkspaceSpecTemplate & {
  attributes?: DevWorkspaceSpecTemplateAttribute;
};
