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

// https://github.com/eclipse-che/che-theia/blob/c9d74c0e05cf1323a524574c23bb26c73981743b/extensions/eclipse-che-theia-remote-impl-che-server/src/node/che-server-devfile-service-impl.ts

import {
  V220DevfileCommands,
  V220DevfileComponents,
  V220DevfileComponentsItemsContainerEndpoints,
  V220DevfileComponentsItemsContainerEnv,
  V220DevfileProjects,
  V220DevfileProjectsItemsGit,
} from '@devfile/api';
import { che as cheApi } from '@eclipse-che/api';
import devfileApi from '../../services/devfileApi';

export class DevfileConverter {
  componentEndpointV2toComponentEndpointV1(
    componentEndpoints?: V220DevfileComponentsItemsContainerEndpoints[],
  ): cheApi.workspace.devfile.Endpoint[] | undefined {
    if (componentEndpoints) {
      return componentEndpoints.map(endpointV2 => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const endpoint: any = {};
        if (endpointV2.name) {
          endpoint.name = endpointV2.name;
        }
        if (endpointV2.targetPort) {
          endpoint.port = endpointV2.targetPort;
        }
        if (endpointV2.attributes) {
          endpoint.attributes = endpointV2.attributes;
        }
        if (endpoint.exposure === 'internal') {
          if (!endpoint.attributes) {
            endpoint.attributes = {};
          }
          endpoint.attributes['public'] = 'false';
        }
        return endpoint;
      });
    }
    return undefined;
  }

  componentEnvV2toComponentEnvV1(
    componentEnvs?: V220DevfileComponentsItemsContainerEnv[],
  ): cheApi.workspace.devfile.Env[] | undefined {
    if (componentEnvs) {
      return componentEnvs.map(envV2 => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const env: any = {};
        if (envV2.name !== undefined) {
          env.name = envV2.name;
        }
        if (envV2.value !== undefined) {
          env.value = envV2.value;
        }
        return env;
      });
    }
    return undefined;
  }

  componentV2toComponentV1(componentV2: V220DevfileComponents): cheApi.workspace.devfile.Component {
    if (componentV2.kubernetes) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return JSON.parse(componentV2.kubernetes!.inlined!) as cheApi.workspace.devfile.Component;
    } else if (componentV2.openshift) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return JSON.parse(componentV2.openshift!.inlined!) as cheApi.workspace.devfile.Component;
    }

    const devfileV1Component: cheApi.workspace.devfile.Component = {};

    if (componentV2.container) {
      devfileV1Component.type = 'dockerimage';

      if (componentV2.container.memoryLimit) {
        devfileV1Component.memoryLimit = componentV2.container.memoryLimit;
      }
      if (componentV2.container.memoryRequest) {
        devfileV1Component.memoryRequest = componentV2.container.memoryRequest;
      }
      if (componentV2.container.cpuLimit) {
        devfileV1Component.cpuLimit = componentV2.container.cpuLimit;
      }
      if (componentV2.container.cpuRequest) {
        devfileV1Component.cpuRequest = componentV2.container.cpuRequest;
      }
      if (componentV2.name) {
        devfileV1Component.alias = componentV2.name;
      }

      if (componentV2.container.mountSources) {
        devfileV1Component.mountSources = componentV2.container.mountSources;
      }
      if (componentV2.container.args) {
        devfileV1Component.args = componentV2.container.args;
      }
      if (componentV2.container.command) {
        devfileV1Component.command = componentV2.container.command;
      }
      if (componentV2.container.image) {
        devfileV1Component.image = componentV2.container.image;
      }

      devfileV1Component.env = this.componentEnvV2toComponentEnvV1(componentV2.container.env);
      devfileV1Component.endpoints = this.componentEndpointV2toComponentEndpointV1(
        componentV2.container.endpoints,
      );
    }

    if (!devfileV1Component.env) {
      delete devfileV1Component.env;
    }
    if (!devfileV1Component.volumes) {
      delete devfileV1Component.volumes;
    }
    if (!devfileV1Component.endpoints) {
      delete devfileV1Component.endpoints;
    }

    return devfileV1Component;
  }

  commandV2toCommandV1(commandV2: V220DevfileCommands): cheApi.workspace.devfile.DevfileCommand {
    const devfileV1Command: cheApi.workspace.devfile.DevfileCommand = {};

    if (commandV2.id) {
      devfileV1Command.name = commandV2.id;
    }

    if (commandV2.exec) {
      const devfileAction: cheApi.workspace.devfile.DevfileAction = {};
      if (commandV2.exec.commandLine) {
        devfileAction.command = commandV2.exec.commandLine;
      }
      if (commandV2.exec.component) {
        devfileAction.component = commandV2.exec.component;
      }
      if (commandV2.exec.workingDir) {
        devfileAction.workdir = commandV2.exec.workingDir;
      }
      devfileAction.type = 'exec';
      devfileV1Command.actions = [devfileAction];
    }
    return devfileV1Command;
  }

  projectInfoToProjectSource(
    project: V220DevfileProjects,
    projectInfo: V220DevfileProjectsItemsGit,
  ): cheApi.workspace.devfile.Source {
    const gitSource: cheApi.workspace.devfile.Source = {};

    if (projectInfo.checkoutFrom) {
      if (!project.attributes) {
        const projectAttributes = {};
        project.attributes = projectAttributes;
      }
      if (project.attributes['source-origin']) {
        const origin = project.attributes['source-origin'];
        delete project.attributes['source-origin'];
        if (origin === 'branch') {
          gitSource.branch = projectInfo.checkoutFrom.revision;
        }
        if (origin === 'commitId') {
          gitSource.commitId = projectInfo.checkoutFrom.revision;
        }
        if (origin === 'startPoint') {
          gitSource.startPoint = projectInfo.checkoutFrom.revision;
        }
        if (origin === 'tag') {
          gitSource.tag = projectInfo.checkoutFrom.revision;
        }
      } else {
        gitSource.startPoint = projectInfo.checkoutFrom.revision;
      }
    }
    const remoteKeys = Object.keys(projectInfo.remotes);
    gitSource.location = projectInfo.remotes[remoteKeys[0]];
    gitSource.type = 'git';
    return gitSource;
  }

  metadataV2toMetadataV1(
    metadataV2?: devfileApi.DevfileMetadata,
  ): cheApi.workspace.devfile.Metadata {
    const devfileMetadataV1: cheApi.workspace.devfile.Metadata = {};
    if (metadataV2) {
      if (metadataV2.name) {
        const metaDataAttributes = metadataV2.attributes || {};
        const nameField = metaDataAttributes['metadata-name-field'];
        if (nameField === 'generateName') {
          devfileMetadataV1.generateName = metadataV2.name;
        } else if (nameField === 'name') {
          devfileMetadataV1.name = metadataV2.name;
        } else {
          devfileMetadataV1.generateName = metadataV2.name;
        }
        if (metadataV2.attributes) {
          delete metadataV2.attributes['metadata-name-field'];
        }
      }
    }
    return devfileMetadataV1;
  }

  projectV2toProjectV1(projectV2: V220DevfileProjects): cheApi.workspace.devfile.Project {
    const devfileV1Project: cheApi.workspace.devfile.Project = {
      name: projectV2.name,
    };
    if (projectV2.clonePath) {
      devfileV1Project.clonePath = projectV2.clonePath;
    }

    if (projectV2.git) {
      devfileV1Project.source = this.projectInfoToProjectSource(projectV2, projectV2.git);
    } else if (projectV2.zip) {
      devfileV1Project.source = {
        type: 'zip',
        location: projectV2.zip.location,
      };
    }

    return devfileV1Project;
  }

  devfileV2toDevfileV1(devfileV2: devfileApi.Devfile): che.WorkspaceDevfile {
    const devfileV1: cheApi.workspace.devfile.Devfile = {
      apiVersion: '1.0.0',
      metadata: this.metadataV2toMetadataV1(devfileV2.metadata),
      projects: (devfileV2.projects || []).map(project => this.projectV2toProjectV1(project)),
      components: (devfileV2.components || [])
        .map(component => this.componentV2toComponentV1(component))
        .filter(component => Object.keys(component).length !== 0),
      commands: (devfileV2.commands || []).map(command => this.commandV2toCommandV1(command)),
    };

    if (devfileV2.metadata.attributes) {
      const attributeKeys = Object.keys(devfileV2.metadata.attributes);
      if (attributeKeys.length > 0) {
        const attributes = devfileV1.attributes || {};
        attributeKeys.forEach(attributeName => {
          // skip attribute that value is not a string
          if (typeof devfileV2.metadata.attributes?.[attributeName] !== 'string') {
            return;
          }
        });
        if (Object.keys(attributes).length > 0) {
          devfileV1.attributes = attributes;
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const devfileV1Any = devfileV1 as any;

    if (devfileV1.components && devfileV1.components.length === 0) {
      delete devfileV1Any.components;
    }

    if (devfileV1.projects && devfileV1.projects.length === 0) {
      delete devfileV1Any.projects;
    }

    if (devfileV1.commands && devfileV1.commands.length === 0) {
      delete devfileV1Any.commands;
    }

    return devfileV1 as che.WorkspaceDevfile;
  }
}
