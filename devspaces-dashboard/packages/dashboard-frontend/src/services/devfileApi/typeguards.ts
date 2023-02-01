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

import devfileApi from '.';

export function isDevfileV2Like(devfile: unknown): devfile is devfileApi.DevfileLike {
  return (devfile as devfileApi.DevfileLike).schemaVersion !== undefined;
}

const schemaVersionRe =
  /^([2-9])\.([0-9]+)\.([0-9]+)(-[0-9a-z-]+(\.[0-9a-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/;
export function isDevfileV2(devfile: unknown): devfile is devfileApi.Devfile {
  return (
    (devfile as devfileApi.Devfile).schemaVersion !== undefined &&
    schemaVersionRe.test((devfile as devfileApi.Devfile).schemaVersion)
  );
}

export function isDevWorkspaceLike(workspace: unknown): workspace is devfileApi.DevWorkspaceLike {
  return (workspace as devfileApi.DevWorkspaceLike).kind === 'DevWorkspace';
}

export function isDevWorkspace(workspace: unknown): workspace is devfileApi.DevWorkspace {
  return (
    workspace !== undefined &&
    isDevWorkspaceLike(workspace as devfileApi.DevWorkspace) &&
    (workspace as devfileApi.DevWorkspace).apiVersion !== undefined &&
    isDevWorkspaceMetadata((workspace as devfileApi.DevWorkspace).metadata) &&
    isDevWorkspaceSpec((workspace as devfileApi.DevWorkspace).spec)
  );
}

export function isDevWorkspaceSpec(spec: unknown): spec is devfileApi.DevWorkspaceSpec {
  return spec !== undefined && (spec as devfileApi.DevWorkspaceSpec).template !== undefined;
}

export function isDevWorkspaceMetadata(
  metadata: unknown,
): metadata is devfileApi.DevWorkspaceMetadata {
  return (
    metadata !== undefined &&
    (metadata as devfileApi.DevWorkspaceMetadata).labels !== undefined &&
    (metadata as devfileApi.DevWorkspaceMetadata).name !== undefined &&
    (metadata as devfileApi.DevWorkspaceMetadata).namespace !== undefined &&
    (metadata as devfileApi.DevWorkspaceMetadata).uid !== undefined
  );
}

export function isDevWorkspaceTemplateLike(
  template: unknown,
): template is devfileApi.DevWorkspaceTemplateLike {
  return (
    template !== undefined &&
    (template as devfileApi.DevWorkspaceTemplateLike).kind === 'DevWorkspaceTemplate'
  );
}

export function isDevWorkspaceTemplate(
  template: unknown,
): template is devfileApi.DevWorkspaceTemplate {
  return (
    template !== undefined &&
    isDevWorkspaceTemplateLike(template as devfileApi.DevWorkspaceTemplate) &&
    isDevWorkspaceTemplateMetadata((template as devfileApi.DevWorkspaceTemplate).metadata)
  );
}

export function isDevWorkspaceTemplateMetadata(
  metadata: unknown,
): metadata is devfileApi.DevWorkspaceTemplateMetadata {
  return (
    metadata !== undefined &&
    (metadata as devfileApi.DevWorkspaceTemplateMetadata).name !== undefined &&
    (metadata as devfileApi.DevWorkspaceTemplateMetadata).namespace !== undefined
  );
}
