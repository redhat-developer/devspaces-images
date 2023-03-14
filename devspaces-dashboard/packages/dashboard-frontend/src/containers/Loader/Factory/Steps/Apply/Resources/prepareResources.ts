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

import { dump } from 'js-yaml';
import { cloneDeep } from 'lodash';
import { DevWorkspaceTemplate } from '../../../../../../services/devfileApi/devfileApi';
import { DevWorkspace } from '../../../../../../services/devfileApi/devWorkspace';
import { DEVWORKSPACE_STORAGE_TYPE_ATTR } from '../../../../../../services/devfileApi/devWorkspace/spec/template';
import { generateSuffix } from '../../../../../../services/helpers/generateName';
import { DEVWORKSPACE_DEVFILE_SOURCE } from '../../../../../../services/workspace-client/devworkspace/devWorkspaceClient';
import { DevWorkspaceResources } from '../../../../../../store/DevfileRegistries';

export default function prepareResources(
  _resources: DevWorkspaceResources,
  factoryId: string,
  storageType: che.WorkspaceStorageType | undefined,
  appendSuffix: boolean,
): DevWorkspaceResources {
  const resources = cloneDeep(_resources);
  const [devWorkspace, devWorkspaceTemplate] = resources;

  // add the factoryId to the devfile source section
  const { metadata } = devWorkspace;
  if (!metadata.annotations) {
    metadata.annotations = {};
  }
  metadata.annotations[DEVWORKSPACE_DEVFILE_SOURCE] = dump({
    factory: { params: factoryId },
  });

  // update the DevWorkspace and DevWorkspaceTemplate names in accordance to the policy
  if (appendSuffix == true || devWorkspace.metadata.generateName !== undefined) {
    addSuffix(devWorkspace, devWorkspaceTemplate);
  }

  // set storage type attribute
  if (storageType === 'ephemeral') {
    if (!devWorkspace.spec.template.attributes) {
      devWorkspace.spec.template.attributes = {};
    }
    devWorkspace.spec.template.attributes[DEVWORKSPACE_STORAGE_TYPE_ATTR] = storageType;
  } else if (devWorkspace.spec?.template?.attributes?.[DEVWORKSPACE_STORAGE_TYPE_ATTR]) {
    delete devWorkspace.spec.template.attributes[DEVWORKSPACE_STORAGE_TYPE_ATTR];
  }

  return [devWorkspace, devWorkspaceTemplate];
}

function addSuffix(devWorkspace: DevWorkspace, devWorkspaceTemplate: DevWorkspaceTemplate) {
  const suffix = generateSuffix();
  const editorPluginName = devWorkspaceTemplate.metadata.name;

  if (devWorkspace.metadata.generateName !== undefined) {
    // assign devworkspace name
    devWorkspace.metadata.name = devWorkspace.metadata.generateName + suffix;
    delete devWorkspace.metadata.generateName;
  } else {
    // update devworkspace name
    devWorkspace.metadata.name += suffix;
  }

  // update editor plugin name
  const editorPlugin = devWorkspace.spec.contributions?.find(
    component => component.name === editorPluginName,
  );
  if (editorPlugin) {
    editorPlugin.name = editorPluginName + suffix;
    if (editorPlugin?.kubernetes) {
      editorPlugin.kubernetes.name = editorPluginName + suffix;
    }
  }

  // update DevWorkspaceTemplate name
  devWorkspaceTemplate.metadata.name = editorPluginName + suffix;

  // update DevWorkspace contribution name
  const contributions = devWorkspace.spec.contributions;
  if (contributions && contributions.length > 0) {
    contributions.forEach(contribution => {
      if (contribution.name === 'editor' && contribution.kubernetes) {
        contribution.kubernetes.name = editorPluginName + suffix;
      }
    });
  }
}
