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

import getRandomString from '../../services/helpers/random';
import { WorkspaceStatus } from '../../services/helpers/types';
import { cloneDeep } from 'lodash';

export const CHE_DEVFILE_STUB: che.WorkspaceDevfile = {
  apiVersion: '1.0.0',
  metadata: {
    name: 'wksp-' + getRandomString(4),
  },
} as che.WorkspaceDevfile;

export const CHE_RUNTIME_STUB: che.WorkspaceRuntime = {
  machines: {
    'theia-ide': {
      attributes: {
        source: 'tool',
      },
      servers: {
        theia: {
          status: WorkspaceStatus.RUNNING,
          attributes: {
            type: 'ide',
          },
          url: 'url/ide/' + getRandomString(4),
        },
      },
      status: WorkspaceStatus.RUNNING,
    },
  },
  status: WorkspaceStatus.RUNNING,
  activeEnv: 'default',
};

export class CheWorkspaceBuilder {
  private workspace: che.Workspace = {
    id: getRandomString(4),
    attributes: {
      infrastructureNamespace: 'che',
    } as che.WorkspaceAttributes,
    status: WorkspaceStatus.STOPPED,
    namespace: 'admin',
    devfile: cloneDeep(CHE_DEVFILE_STUB),
  };

  withId(id: string): CheWorkspaceBuilder {
    this.workspace.id = id;
    return this;
  }

  withName(name: string): CheWorkspaceBuilder {
    this.workspace.devfile.metadata.name = name;
    return this;
  }

  withAttributes(attributes: che.WorkspaceAttributes): CheWorkspaceBuilder {
    this.workspace.attributes = Object.assign({}, this.workspace.attributes, attributes);
    return this;
  }

  withDevfile(devfile: che.WorkspaceDevfile): CheWorkspaceBuilder {
    this.workspace.devfile = cloneDeep(devfile);
    return this;
  }

  withProjects(projects: any[]): CheWorkspaceBuilder {
    this.workspace.devfile.projects = cloneDeep(projects);
    return this;
  }

  withStatus(status: keyof typeof WorkspaceStatus): CheWorkspaceBuilder {
    this.workspace.status = status;
    return this;
  }

  withNamespace(namespace: string): CheWorkspaceBuilder {
    this.workspace.namespace = namespace;
    if (!this.workspace.attributes) {
      this.workspace.attributes = {} as che.WorkspaceAttributes;
    }
    this.workspace.attributes.infrastructureNamespace = namespace;
    return this;
  }

  withRuntime(runtime: che.WorkspaceRuntime): CheWorkspaceBuilder {
    this.workspace.runtime = cloneDeep(runtime);
    this.workspace.status = WorkspaceStatus.RUNNING;
    return this;
  }

  build(): che.Workspace {
    return this.workspace;
  }
}
