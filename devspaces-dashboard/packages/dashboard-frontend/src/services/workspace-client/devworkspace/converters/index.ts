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

import { V1alpha2DevWorkspaceSpecTemplateComponents } from '@devfile/api';
import devfileApi, { isDevfileV2 } from '../../../devfileApi';
import { DevWorkspaceSpecTemplateAttribute } from '../../../devfileApi/devWorkspace/spec/template';
import { DEVWORKSPACE_DEVFILE, DEVWORKSPACE_METADATA_ANNOTATION } from '../devWorkspaceClient';
import { load } from 'js-yaml';
import { helpers } from '@eclipse-che/common';

export const devfileSchemaVersion = '2.2.0';

export const devWorkspaceVersion = 'v1alpha2';
export const devWorkspaceApiGroup = 'workspace.devfile.io';
export const devWorkspaceSingularSubresource = 'devworkspace';

export function devfileToDevWorkspace(
  devfile: devfileApi.Devfile,
  routingClass: string,
  started: boolean,
): devfileApi.DevWorkspace {
  const devfileAttributes = devfile.metadata.attributes || {};
  if (devfile.attributes) {
    Object.assign(devfileAttributes, devfile.attributes);
  }
  const devWorkspaceAnnotations = devfileAttributes[DEVWORKSPACE_METADATA_ANNOTATION] || {};

  const devWorkspaceAttributes: DevWorkspaceSpecTemplateAttribute = {};
  Object.keys(devfileAttributes).forEach(key => {
    devWorkspaceAttributes[key] = devfileAttributes[key];
  });

  const devWorkspace: devfileApi.DevWorkspace = {
    apiVersion: `${devWorkspaceApiGroup}/${devWorkspaceVersion}`,
    kind: 'DevWorkspace',
    metadata: {
      name: devfile.metadata.name,
      namespace: devfile.metadata.namespace,
      annotations: devWorkspaceAnnotations,
      labels: {},
      uid: '',
    },
    spec: {
      started,
      routingClass,
      template: {
        components: [],
      },
    },
  };
  if (Object.keys(devWorkspaceAttributes).length > 0) {
    devWorkspace.spec.template.attributes = devWorkspaceAttributes;
  }
  if (devfile.parent) {
    devWorkspace.spec.template.parent = devfile.parent;
  }
  if (devfile.projects) {
    devWorkspace.spec.template.projects = devfile.projects;
  }
  if (devfile.components) {
    devWorkspace.spec.template.components = devfile.components;
  }
  if (devfile.commands) {
    devWorkspace.spec.template.commands = devfile.commands;
  }
  if (devfile.events) {
    devWorkspace.spec.template.events = devfile.events;
  }
  return devWorkspace;
}

export function devWorkspaceToDevfile(devworkspace: devfileApi.DevWorkspace): devfileApi.Devfile {
  let originDevfile: devfileApi.Devfile | undefined;
  if (devworkspace.metadata?.annotations?.[DEVWORKSPACE_DEVFILE]) {
    try {
      const loadedObject = load(devworkspace.metadata.annotations[DEVWORKSPACE_DEVFILE]);
      if (isDevfileV2(loadedObject)) {
        originDevfile = loadedObject;
      } else {
        throw new Error('The target object is not devfile V2.');
      }
    } catch (e) {
      const errorMessage = helpers.errors.getMessage(e);
      console.debug(`Failed to parse the origin devfile. ${errorMessage}`);
    }
  }

  const schemaVersion = originDevfile?.schemaVersion || devfileSchemaVersion;
  const metadata = originDevfile?.metadata || {
    name: devworkspace.metadata.name,
    namespace: devworkspace.metadata.namespace,
  };

  const template = {
    schemaVersion,
    metadata,
    components: [],
  } as devfileApi.Devfile;
  if (devworkspace.spec.template.parent) {
    template.parent = devworkspace.spec.template.parent;
  }
  if (devworkspace.spec.template.projects) {
    template.projects = devworkspace.spec.template.projects;
  }
  if (devworkspace.spec.template.components) {
    template.components = filterPluginComponents(devworkspace.spec.template.components);
  }
  if (devworkspace.spec.template.commands) {
    template.commands = devworkspace.spec.template.commands;
  }
  if (devworkspace.spec.template.events) {
    template.events = devworkspace.spec.template.events;
  }
  if (devworkspace.spec.template.attributes) {
    const devWorkspaceAttributes: DevWorkspaceSpecTemplateAttribute = {};
    Object.keys(devworkspace.spec.template.attributes).forEach(key => {
      devWorkspaceAttributes[key] = devworkspace.spec.template.attributes?.[key];
    });
    if (Object.keys(devWorkspaceAttributes).length > 0) {
      template.attributes = devWorkspaceAttributes;
    }
  }
  return template;
}

// Filter plugins from components
function filterPluginComponents(
  components: V1alpha2DevWorkspaceSpecTemplateComponents[],
): V1alpha2DevWorkspaceSpecTemplateComponents[] {
  return components.filter(comp => !('plugin' in comp));
}
