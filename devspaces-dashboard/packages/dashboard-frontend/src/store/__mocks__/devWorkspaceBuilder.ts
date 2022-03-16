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

import { V1alpha2DevWorkspaceSpecTemplate } from '@devfile/api';
import devfileApi from '../../services/devfileApi';
import getRandomString from '../../services/helpers/random';
import { DevWorkspaceStatus } from '../../services/helpers/types';

export class DevWorkspaceBuilder {
  private workspace: devfileApi.DevWorkspace = {
    kind: 'DevWorkspace',
    apiVersion: 'workspace.devfile.io/v1alpha2',
    metadata: {
      annotations: {},
      labels: {},
      name: 'dev-wksp-' + getRandomString(4),
      namespace: '',
      uid: 'uid-' + getRandomString(4),
    },
    spec: {
      started: false,
      routingClass: 'che',
      template: {},
    },
  };

  private buildStatus(id?: string): devfileApi.DevWorkspaceStatus {
    return {
      devworkspaceId: id
        ? id
        : 'workspace' + this.workspace.metadata.uid.split('-').splice(0, 3).join(''),
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

  withTemplate(template: V1alpha2DevWorkspaceSpecTemplate): DevWorkspaceBuilder {
    this.workspace.spec.template = template;
    return this;
  }

  /**
   * @deprecated use `withStatus`
   * @param ideUrl
   * @returns
   */
  withIdeUrl(ideUrl: string): DevWorkspaceBuilder {
    if (this.workspace.status === undefined) {
      this.workspace.status = this.buildStatus();
    }
    this.workspace.status.mainUrl = ideUrl;
    return this;
  }

  withStatus(status: {
    phase?: keyof typeof DevWorkspaceStatus;
    devworkspaceId?: string;
    mainUrl?: string;
    message?: string;
  }): DevWorkspaceBuilder {
    if (this.workspace.status === undefined) {
      this.workspace.status = this.buildStatus();
    }
    if (status.phase) {
      this.workspace.status.phase = DevWorkspaceStatus[status.phase];
    }
    if (status.devworkspaceId) {
      this.workspace.status.devworkspaceId = status.devworkspaceId;
    }
    if (status.mainUrl) {
      this.workspace.status.mainUrl = status.mainUrl;
    }
    if (status.message) {
      this.workspace.status.message = status.message;
    }
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
