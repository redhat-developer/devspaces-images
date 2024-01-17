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

import { che } from '@/services/models';

export class DevfileBuilder {
  private devfile: che.api.workspace.devfile.Devfile = {
    apiVersion: '1.0.0',
    metadata: {
      generateName: 'stub-devfile-',
    },
  } as che.api.workspace.devfile.Devfile;

  public withName(name: string): DevfileBuilder {
    this.devfile.metadata!.name = name;
    delete this.devfile.metadata!.generateName;
    return this;
  }

  public withComponents(components: Array<che.api.workspace.devfile.Component[]>): DevfileBuilder {
    this.devfile.components = Object.assign([], components);
    return this;
  }

  public withProjects(projects: Array<che.api.workspace.devfile.Project[]>): DevfileBuilder {
    this.devfile.projects = Object.assign([], projects);
    return this;
  }

  public withCommands(commands: Array<che.api.workspace.devfile.DevfileCommand[]>): DevfileBuilder {
    this.devfile.commands = Object.assign([], commands);
    return this;
  }

  public withAttributes(attributes: che.WorkspaceDevfileAttributes): DevfileBuilder {
    this.devfile.attributes = Object.assign({}, attributes);
    return this;
  }

  public build(): che.api.workspace.devfile.Devfile {
    return this.devfile;
  }
}
