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

import { V1alpha2DevWorkspace } from '@devfile/api';
import { DevWorkspaceMetadata } from './metadata';
import { DevWorkspaceSpec } from './spec';

export type DevWorkspaceKind = 'DevWorkspace';
export const devWorkspaceKind: DevWorkspaceKind = 'DevWorkspace';

type DevWorkspaceLikeRequired = Pick<V1alpha2DevWorkspace, 'apiVersion' | 'kind'>;

export type DevWorkspaceLike = V1alpha2DevWorkspace &
  Required<DevWorkspaceLikeRequired> & {
    kind: DevWorkspaceKind;
  };

type DevWorkspaceRequired = Pick<DevWorkspaceLike, 'apiVersion' | 'kind' | 'metadata' | 'spec'>;
type DevWorkspaceRequiredField = keyof DevWorkspaceRequired;

export const devWorkspaceRequiredFields: `${DevWorkspaceRequiredField} | ${DevWorkspaceRequiredField} | ${DevWorkspaceRequiredField} | ${DevWorkspaceRequiredField}` =
  'apiVersion | kind | metadata | spec';

export type DevWorkspace = DevWorkspaceLike &
  Required<DevWorkspaceRequired> & {
    metadata: DevWorkspaceMetadata;
    spec: DevWorkspaceSpec;
  };
