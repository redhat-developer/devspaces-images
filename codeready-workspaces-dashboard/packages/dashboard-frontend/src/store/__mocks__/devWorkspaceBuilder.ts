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

import devfileApi from '../../services/devfileApi';
import getRandomString from '../../services/helpers/random';
import { DevWorkspaceStatus, WorkspaceStatus } from '../../services/helpers/types';

export class DevWorkspaceBuilder {

  private workspace: devfileApi.DevWorkspace = {
    kind: 'DevWorkspace',
    apiVersion: 'workspace.devfile.io/v1alpha2',
    metadata: {
      annotations: {},
      labels: {},
      name: 'dev-wksp-' + getRandomString(4),
      namespace: '',
      uid: 'uid-' + getRandomString(4)
    },
    spec: {
      started: false,
      routingClass: 'che',
      template: {},
    },
  }

  private buildStatus(id?: string): devfileApi.DevWorkspaceStatus {
    return {
      devworkspaceId: (id ? id : 'workspace' + this.workspace.metadata.uid.split('-').splice(0, 3).join('')),
    };
  }

  withId(id: string): DevWorkspaceBuilder {
    if (this.workspace.status === undefined) {
      this.workspace.status = this.buildStatus(id);
    } else {
      this.workspace.status.devworkspaceId = id;
    }
    return this;
  }

  withName(name: string): DevWorkspaceBuilder {
    this.workspace.metadata.name = name;
    return this;
  }

  withMetadata(metadata: Partial<devfileApi.DevWorkspaceMetadata>): DevWorkspaceBuilder {
    Object.assign(this.workspace.metadata, metadata);
    return this;
  }

  withNamespace(namespace: string): DevWorkspaceBuilder {
    this.workspace.metadata.namespace = namespace;
    return this;
  }

  withIdeUrl(ideUrl: string): DevWorkspaceBuilder {
    if (this.workspace.status === undefined) {
      this.workspace.status = this.buildStatus();
    }
    this.workspace.status.mainUrl = ideUrl;
    return this;
  }

  withStatus(status: keyof typeof WorkspaceStatus | keyof typeof DevWorkspaceStatus): DevWorkspaceBuilder {
    if (this.workspace.status === undefined) {
      this.workspace.status = this.buildStatus();
    }
    this.workspace.status.phase = status;
    return this;
  }

  withProjects(projects: any): DevWorkspaceBuilder {
    this.workspace.spec.template.projects = projects;
    return this;
  }

  build(): devfileApi.DevWorkspace {
    return this.workspace;
  }

}
