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

import devfileApi from '../../../devfileApi';
import { DEVWORKSPACE_METADATA_ANNOTATION } from '../devWorkspaceClient';

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

  const devWorkspaceAttributes: { [key: string]: any } = {};
  Object.keys(devfileAttributes).forEach(key => {
    devWorkspaceAttributes[key] = devfileAttributes[key];
  });

  const template: devfileApi.DevWorkspace = {
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
    template.spec.template.attributes = devWorkspaceAttributes;
  }
  if (devfile.parent) {
    template.spec.template.parent = devfile.parent;
  }
  if (devfile.projects) {
    template.spec.template.projects = devfile.projects;
  }
  if (devfile.components) {
    template.spec.template.components = devfile.components;
  }
  if (devfile.commands) {
    template.spec.template.commands = devfile.commands;
  }
  if (devfile.events) {
    template.spec.template.events = devfile.events;
  }
  return template;
}

export function devWorkspaceToDevfile(devworkspace: devfileApi.DevWorkspace): devfileApi.Devfile {
  const template = {
    schemaVersion: '2.1.0',
    metadata: {
      name: devworkspace.metadata.name,
      namespace: devworkspace.metadata.namespace,
    },
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
    const devWorkspaceAttributes: { [key: string]: any } = {};
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
function filterPluginComponents(components: any[]): any[] {
  return components.filter(comp => !('plugin' in comp));
}
