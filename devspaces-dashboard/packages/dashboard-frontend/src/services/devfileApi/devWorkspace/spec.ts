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

import { V1alpha2DevWorkspaceSpec } from '@devfile/api';

export const DEVWORKSPACE_STORAGE_TYPE = 'controller.devfile.io/storage-type';
export const DEVWORKSPACE_DEPLOYMENT_LABEL = 'controller.devfile.io/deployment-labels';
export const DEVWORKSPACE_DEPLOYMENT_ANNOTATION = 'controller.devfile.io/deployment-annotations';

type DevWorkspaceSpecTemplateAttribute = {
  [DEVWORKSPACE_STORAGE_TYPE]?: string;
  [DEVWORKSPACE_DEPLOYMENT_LABEL]?: string;
  [DEVWORKSPACE_DEPLOYMENT_ANNOTATION]?: string;
};

export type DevWorkspaceSpec = V1alpha2DevWorkspaceSpec &
  Required<Pick<V1alpha2DevWorkspaceSpec, 'template'>> & {
    attributes?: DevWorkspaceSpecTemplateAttribute;
  };
