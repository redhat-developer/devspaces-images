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

export const DEV_WORKSPACE_ATTR = 'devWorkspace';
export const EDITOR_ATTR = 'che-editor';
export const ERROR_CODE_ATTR = 'error_code';
export const FACTORY_URL_ATTR = 'url';
export const POLICIES_CREATE_ATTR = 'policies.create';
export const STORAGE_TYPE_ATTR = 'storageType';
export const REMOTES_ATTR = 'remotes';
export const IMAGE_ATTR = 'image';
export const PROPAGATE_FACTORY_ATTRS = [
  'workspaceDeploymentAnnotations',
  'workspaceDeploymentLabels',
  DEV_WORKSPACE_ATTR,
  EDITOR_ATTR,
  FACTORY_URL_ATTR,
  POLICIES_CREATE_ATTR,
  STORAGE_TYPE_ATTR,
  REMOTES_ATTR,
];
export const OVERRIDE_ATTR_PREFIX = 'override.';

export const DEFAULT_POLICIES_CREATE = 'peruser';

export const MIN_STEP_DURATION_MS = 200;
export const TIMEOUT_TO_CREATE_SEC = 20;
export const TIMEOUT_TO_GET_URL_SEC = 20;
export const TIMEOUT_TO_RESOLVE_SEC = 20;
export const TIMEOUT_TO_STOP_SEC = 60;
