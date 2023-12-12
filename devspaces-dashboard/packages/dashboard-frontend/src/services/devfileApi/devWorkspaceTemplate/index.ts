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

import { V1alpha2DevWorkspaceTemplate } from '@devfile/api';

import { DevWorkspaceTemplateMetadata } from '@/services/devfileApi/devWorkspaceTemplate/metadata';

export type DevWorkspaceTemplateLike = V1alpha2DevWorkspaceTemplate &
  Required<Pick<V1alpha2DevWorkspaceTemplate, 'apiVersion' | 'kind'>>;

type DevWorkspaceTemplateRequired = Pick<
  V1alpha2DevWorkspaceTemplate,
  'apiVersion' | 'kind' | 'metadata'
>;
type DevWorkspaceTemplateRequiredField = keyof DevWorkspaceTemplateRequired;

export const devWorkspaceTemplateRequiredFields: `${DevWorkspaceTemplateRequiredField} | ${DevWorkspaceTemplateRequiredField} | ${DevWorkspaceTemplateRequiredField}` =
  'apiVersion | kind | metadata';

export type DevWorkspaceTemplate = V1alpha2DevWorkspaceTemplate &
  Required<DevWorkspaceTemplateRequired> & {
    metadata: DevWorkspaceTemplateMetadata;
  };
