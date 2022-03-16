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

import { V1alpha2DevWorkspaceTemplateMetadata } from '@devfile/api';

export type DevWorkspaceTemplateMetadata = V1alpha2DevWorkspaceTemplateMetadata &
  Required<Pick<V1alpha2DevWorkspaceTemplateMetadata, 'annotations' | 'name' | 'namespace'>>;
