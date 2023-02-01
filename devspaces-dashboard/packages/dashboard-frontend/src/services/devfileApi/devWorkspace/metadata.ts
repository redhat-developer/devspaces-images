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

import { V1alpha2DevWorkspaceMetadata } from '@devfile/api';

export const DEVWORKSPACE_CHE_EDITOR = 'che.eclipse.org/che-editor';
// used by devworkspace-controller to allow to mount the corresponding Che7 workspace folder
export const DEVWORKSPACE_ID_OVERRIDE_ANNOTATION = 'controller.devfile.io/devworkspace_id_override';
export const DEVWORKSPACE_UPDATING_TIMESTAMP_ANNOTATION = 'che.eclipse.org/last-updated-timestamp';
type DevWorkspaceMetadataAnnotation = {
  [DEVWORKSPACE_CHE_EDITOR]?: string;
  [DEVWORKSPACE_ID_OVERRIDE_ANNOTATION]?: string;
  [DEVWORKSPACE_UPDATING_TIMESTAMP_ANNOTATION]?: string;
};

export type DevWorkspaceMetadata = V1alpha2DevWorkspaceMetadata &
  Required<Pick<V1alpha2DevWorkspaceMetadata, 'labels' | 'name' | 'namespace' | 'uid'>> & {
    annotations?: DevWorkspaceMetadataAnnotation;
  };
