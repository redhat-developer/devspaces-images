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
import { DevWorkspacePlugin } from '../../services/devfileApi/devWorkspace';
import devfileApi from '../../services/devfileApi';

export default function updateDevWorkspacePlugins(devWorkspace: devfileApi.DevWorkspace): void {
  if (!devWorkspace.spec.contributions) {
    devWorkspace.spec.contributions = [];
  }
  const contributions = devWorkspace.spec.contributions;
  const components: V1alpha2DevWorkspaceSpecTemplateComponents[] = [];
  const allComponents = devWorkspace.spec.template.components || [];
  allComponents.forEach(component => {
    if (component.plugin) {
      const contribution = Object.assign({}, component.plugin, component);
      delete contribution.plugin;
      contributions.push(contribution as DevWorkspacePlugin);
    } else {
      components.push(component);
    }
  });
  if (contributions[0]) {
    devWorkspace.spec.template.components = components;
  }
}
