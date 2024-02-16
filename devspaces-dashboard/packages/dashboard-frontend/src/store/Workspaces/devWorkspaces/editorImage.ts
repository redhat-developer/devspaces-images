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

import { V222DevfileComponents } from '@devfile/api';
import common from '@eclipse-che/common';
import { dump, load } from 'js-yaml';
import cloneDeep from 'lodash/cloneDeep';

import { FactorySource } from '@/components/WorkspaceProgress/CreatingSteps/Apply/Devfile/prepareDevfile';
import devfileApi from '@/services/devfileApi';
import { buildFactoryParams } from '@/services/helpers/factoryFlow/buildFactoryParams';
import { COMPONENT_UPDATE_POLICY } from '@/services/workspace-client/devworkspace/devWorkspaceClient';
import {
  DEVWORKSPACE_DEVFILE_SOURCE,
  DEVWORKSPACE_METADATA_ANNOTATION,
} from '@/services/workspace-client/devworkspace/devWorkspaceClient';

export function updateEditorDevfile(
  editorContent: string,
  editorImage: string | undefined,
): string {
  if (editorImage === undefined) {
    return editorContent;
  }
  if (!editorContent) {
    throw new Error('Editor content is empty.');
  }
  try {
    const editorObj = load(editorContent) as devfileApi.Devfile;
    updateComponents(editorObj.components, editorImage);
    return dump(editorObj);
  } catch (err) {
    throw new Error(`Failed to update editor image. ${common.helpers.errors.getMessage(err)}`);
  }
}

export function updateDevWorkspaceTemplate(
  devWorkspaceTemplate: devfileApi.DevWorkspaceTemplate,
  editorImage: string | undefined,
): devfileApi.DevWorkspaceTemplate {
  if (editorImage === undefined) {
    return devWorkspaceTemplate;
  }
  const _devWorkspaceTemplate = cloneDeep(devWorkspaceTemplate);
  try {
    const isUpdated = updateComponents(_devWorkspaceTemplate.spec?.components, editorImage);
    if (
      isUpdated &&
      _devWorkspaceTemplate.metadata?.annotations?.[COMPONENT_UPDATE_POLICY] === 'managed'
    ) {
      _devWorkspaceTemplate.metadata.annotations[COMPONENT_UPDATE_POLICY] = 'manual';
    }
    return _devWorkspaceTemplate;
  } catch (err) {
    throw new Error(`Failed to update editor image. ${common.helpers.errors.getMessage(err)}`);
  }
}

export function getEditorImage(workspace: devfileApi.DevWorkspace): string | undefined {
  const devfileSourceYaml =
    workspace.spec.template.attributes?.[DEVWORKSPACE_METADATA_ANNOTATION]?.[
      DEVWORKSPACE_DEVFILE_SOURCE
    ];
  if (!devfileSourceYaml) {
    return undefined;
  }
  const factorySearchParams = (load(devfileSourceYaml) as FactorySource)?.factory?.params;
  if (!factorySearchParams) {
    return undefined;
  }
  const factoryParams = buildFactoryParams(new URLSearchParams(factorySearchParams));

  return factoryParams.editorImage;
}

function updateComponents(
  components: V222DevfileComponents[] | undefined,
  editorImage: string,
): boolean {
  if (!components) {
    throw new Error('Editor components are not defined.');
  }
  let isUpdated = false;
  for (let i = 0; i < components.length; i++) {
    if (components[i].name.endsWith('-injector') && components[i].container?.image) {
      components[i].container!.image = editorImage;
      isUpdated = true;
      break;
    }
  }
  return isUpdated;
}
