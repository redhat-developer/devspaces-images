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

import {
  devfileToDevWorkspace,
  devWorkspaceToDevfile,
} from '../workspace-client/devworkspace/converters';
import { attributesToType, typeToAttributes } from '../storageTypes';
import { DeprecatedWorkspaceStatus, DevWorkspaceStatus, WorkspaceStatus } from '../helpers/types';
import { DEVWORKSPACE_NEXT_START_ANNOTATION } from '../workspace-client/devworkspace/devWorkspaceClient';
import devfileApi, { isDevfileV2, isDevWorkspace } from '../devfileApi';
import { devWorkspaceKind } from '../devfileApi/devWorkspace';
import { DEVWORKSPACE_UPDATING_TIMESTAMP_ANNOTATION } from '../devfileApi/devWorkspace/metadata';
import { DEVWORKSPACE_STORAGE_TYPE } from '../devfileApi/devWorkspace/spec';

export type Devfile = che.WorkspaceDevfile | devfileApi.Devfile;

export interface Workspace {
  readonly ref: che.Workspace | devfileApi.DevWorkspace;

  readonly id: string;
  readonly uid: string;
  name: string;
  readonly namespace: string;
  readonly infrastructureNamespace: string;
  readonly created: number;
  readonly updated: number;
  status: WorkspaceStatus | DevWorkspaceStatus | DeprecatedWorkspaceStatus;
  readonly ideUrl?: string;
  devfile: Devfile;
  storageType: che.WorkspaceStorageType;
  readonly projects: string[];
  readonly isStarting: boolean;
  readonly isStopped: boolean;
  readonly isStopping: boolean;
  readonly isRunning: boolean;
  readonly hasError: boolean;
  readonly isDevWorkspace: boolean;
  readonly isDeprecated: boolean;
}

export class WorkspaceAdapter<T extends che.Workspace | devfileApi.DevWorkspace>
  implements Workspace
{
  private static deprecatedUIDs: string[] = [];
  private workspace: T;

  constructor(workspace: T) {
    if (isCheWorkspace(workspace) || isDevWorkspace(workspace)) {
      this.workspace = workspace;
    } else {
      console.error('Unexpected workspace object shape:', workspace);
      throw new Error('Unexpected workspace object shape.');
    }
  }

  static setDeprecatedUIDs(UIDs: string[]) {
    WorkspaceAdapter.deprecatedUIDs = UIDs;
  }

  static isDeprecated(workspace: che.Workspace | devfileApi.DevWorkspace): boolean {
    if (isDevWorkspace(workspace)) {
      return false;
    }
    return WorkspaceAdapter.deprecatedUIDs.indexOf(WorkspaceAdapter.getId(workspace)) !== -1;
  }

  /**
   * Returns a workspace ID.
   * Note that IDs may intersect for Che7 workspaces and DevWorkspaces.
   */
  static getId(workspace: che.Workspace | devfileApi.DevWorkspace): string {
    if (isCheWorkspace(workspace)) {
      return workspace.id;
    } else {
      if (workspace.status?.devworkspaceId) {
        return workspace.status.devworkspaceId;
      }
      return 'workspace' + workspace.metadata.uid.split('-').splice(0, 3).join('');
    }
  }

  /**
   * Returns a unique workspace ID.
   */
  static getUID(workspace: che.Workspace | devfileApi.DevWorkspace): string {
    if (isCheWorkspace(workspace)) {
      return workspace.id;
    } else {
      return workspace.metadata.uid;
    }
  }

  static getStatus(
    workspace: che.Workspace | devfileApi.DevWorkspace,
  ): WorkspaceStatus | DevWorkspaceStatus | DeprecatedWorkspaceStatus {
    if (WorkspaceAdapter.isDeprecated(workspace)) {
      return 'Deprecated';
    }
    if (isCheWorkspace(workspace)) {
      return workspace.status as WorkspaceStatus;
    } else {
      if (!workspace.status?.phase) {
        return workspace.spec.started ? DevWorkspaceStatus.STARTING : DevWorkspaceStatus.STOPPED;
      }

      return workspace.status.phase as DevWorkspaceStatus;
    }
  }

  get ref(): T {
    return this.workspace;
  }

  get id(): string {
    return WorkspaceAdapter.getId(this.workspace);
  }

  get uid(): string {
    return WorkspaceAdapter.getUID(this.workspace);
  }

  get name(): string {
    if (isCheWorkspace(this.workspace)) {
      return this.workspace.devfile.metadata.name || '';
    } else {
      return this.workspace.metadata.name;
    }
  }

  set name(name: string) {
    if (isCheWorkspace(this.workspace)) {
      this.workspace.devfile.metadata.name = name;
    } else {
      console.error('Not implemented: set name of the devworkspace.');
    }
  }

  get namespace(): string {
    if (isCheWorkspace(this.workspace)) {
      return this.workspace.namespace || '';
    } else {
      return this.workspace.metadata.namespace;
    }
  }

  get isDevWorkspace(): boolean {
    return isDevWorkspace(this.workspace);
  }

  get infrastructureNamespace(): string {
    if (isCheWorkspace(this.workspace)) {
      return this.workspace.attributes?.infrastructureNamespace || '';
    } else {
      return this.workspace.metadata.namespace;
    }
  }

  /**
   * Returns a workspace creation time in ms
   */
  get created(): number {
    if (isCheWorkspace(this.workspace)) {
      if (this.workspace.attributes?.created) {
        // `created` is a Unix timestamp String
        return new Date(parseInt(this.workspace.attributes.created, 10)).getTime();
      }
    } else {
      if (this.workspace.metadata.creationTimestamp) {
        // `creationTimestamp` is a date time String
        return new Date(this.workspace.metadata.creationTimestamp).getTime();
      }
    }
    return new Date().getTime();
  }

  /**
   * Returns a workspace last updated time in ms
   */
  get updated(): number {
    if (isCheWorkspace(this.workspace)) {
      if (this.workspace.attributes?.updated) {
        return new Date(parseInt(this.workspace.attributes.updated, 10)).getTime();
      }
    } else {
      const updated =
        this.workspace.metadata.annotations?.[DEVWORKSPACE_UPDATING_TIMESTAMP_ANNOTATION];
      if (updated) {
        return new Date(updated).getTime();
      }
    }
    return new Date().getTime();
  }

  get status(): WorkspaceStatus | DevWorkspaceStatus | DeprecatedWorkspaceStatus {
    return WorkspaceAdapter.getStatus(this.workspace);
  }

  get isDeprecated(): boolean {
    return WorkspaceAdapter.isDeprecated(this.workspace);
  }

  get isStarting(): boolean {
    if (isCheWorkspace(this.workspace)) {
      return (this.workspace.status as WorkspaceStatus) === WorkspaceStatus.STARTING;
    } else {
      return (
        (WorkspaceAdapter.getStatus(this.workspace) as DevWorkspaceStatus) ===
        DevWorkspaceStatus.STARTING
      );
    }
  }

  get isStopped(): boolean {
    if (isCheWorkspace(this.workspace)) {
      return (this.workspace.status as WorkspaceStatus) === WorkspaceStatus.STOPPED;
    } else {
      return (
        (WorkspaceAdapter.getStatus(this.workspace) as DevWorkspaceStatus) ===
        DevWorkspaceStatus.STOPPED
      );
    }
  }

  get isStopping(): boolean {
    if (isCheWorkspace(this.workspace)) {
      return (this.workspace.status as WorkspaceStatus) === WorkspaceStatus.STOPPING;
    } else {
      return (
        (WorkspaceAdapter.getStatus(this.workspace) as DevWorkspaceStatus) ===
        DevWorkspaceStatus.STOPPING
      );
    }
  }

  get isRunning(): boolean {
    if (isCheWorkspace(this.workspace)) {
      return (this.workspace.status as WorkspaceStatus) === WorkspaceStatus.RUNNING;
    } else {
      return (
        (WorkspaceAdapter.getStatus(this.workspace) as DevWorkspaceStatus) ===
        DevWorkspaceStatus.RUNNING
      );
    }
  }

  get hasError(): boolean {
    if (isCheWorkspace(this.workspace)) {
      return (this.workspace.status as WorkspaceStatus) === WorkspaceStatus.ERROR;
    } else {
      const devWorkspaceStatus = WorkspaceAdapter.getStatus(this.workspace) as DevWorkspaceStatus;
      return (
        devWorkspaceStatus === DevWorkspaceStatus.FAILED ||
        devWorkspaceStatus === DevWorkspaceStatus.FAILING
      );
    }
  }

  get ideUrl(): string | undefined {
    if (isCheWorkspace(this.workspace)) {
      const runtime = this.workspace.runtime;
      if (!runtime || !runtime.machines) {
        return;
      }
      for (const machineName of Object.keys(runtime.machines)) {
        const servers = runtime.machines[machineName].servers || {};
        for (const serverId of Object.keys(servers)) {
          const attributes = (servers[serverId] as any).attributes;
          if (attributes && attributes['type'] === 'ide') {
            return servers[serverId].url;
          }
        }
      }
    } else {
      return this.workspace.status?.mainUrl;
    }
  }

  get storageType(): che.WorkspaceStorageType {
    if (isCheWorkspace(this.workspace)) {
      return attributesToType(this.workspace.devfile.attributes);
    } else {
      const type = this.workspace.spec.template.attributes?.[DEVWORKSPACE_STORAGE_TYPE];
      if (type === 'ephemeral') {
        return type;
      }
      return 'persistent';
    }
  }

  set storageType(type: che.WorkspaceStorageType) {
    if (isCheWorkspace(this.workspace)) {
      const attributes = typeToAttributes(type);
      if (!this.workspace.devfile.attributes) {
        this.workspace.devfile.attributes = {};
      } else {
        delete this.workspace.devfile.attributes.asyncPersist;
        delete this.workspace.devfile.attributes.persistVolumes;
      }
      if (attributes) {
        Object.assign(this.workspace.devfile.attributes, attributes);
      }
      if (Object.keys(this.workspace.devfile.attributes).length === 0) {
        delete this.workspace.devfile.attributes;
      }
    } else {
      if (type === 'ephemeral') {
        if (!this.workspace.spec.template.attributes) {
          this.workspace.spec.template.attributes = {};
        }
        this.workspace.spec.template.attributes[DEVWORKSPACE_STORAGE_TYPE] = type;
      } else {
        if (this.workspace.spec.template.attributes?.[DEVWORKSPACE_STORAGE_TYPE]) {
          delete this.workspace.spec.template.attributes[DEVWORKSPACE_STORAGE_TYPE];
          if (Object.keys(this.workspace.spec.template.attributes).length === 0) {
            delete this.workspace.spec.template.attributes;
          }
        }
      }
    }
  }

  get devfile(): che.WorkspaceDevfile | devfileApi.Devfile {
    if (isCheWorkspace(this.workspace)) {
      return this.workspace.devfile as T extends che.Workspace
        ? che.WorkspaceDevfile
        : devfileApi.Devfile;
    } else {
      if (
        this.workspace.metadata.annotations &&
        this.workspace.metadata.annotations[DEVWORKSPACE_NEXT_START_ANNOTATION]
      ) {
        const devfile = devWorkspaceToDevfile(
          JSON.parse(this.workspace.metadata.annotations[DEVWORKSPACE_NEXT_START_ANNOTATION]),
        );
        if (isDevfileV2(devfile)) {
          return devfile;
        }
      }
      return devWorkspaceToDevfile(this.workspace) as devfileApi.Devfile;
    }
  }

  set devfile(devfile: che.WorkspaceDevfile | devfileApi.Devfile) {
    if (isCheWorkspace(this.workspace)) {
      this.workspace.devfile = devfile as che.WorkspaceDevfile;
    } else {
      const plugins = (this.workspace.spec.template.components || []).filter(component => {
        return component.plugin !== undefined;
      });
      const converted = devfileToDevWorkspace(
        devfile as devfileApi.Devfile,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.workspace.spec.routingClass!,
        this.workspace.spec.started,
      );
      if (isDevWorkspace(converted)) {
        if (converted.spec.template.components === undefined) {
          converted.spec.template.components = [];
        }
        converted.spec.template.components.push(...plugins);
        (this.workspace as devfileApi.DevWorkspace) = converted;
      } else {
        console.error(
          `WorkspaceAdapter: the received devworkspace either has wrong "kind" (not ${devWorkspaceKind}) or lacks some of mandatory fields: `,
          converted,
        );
        throw new Error(
          'Unexpected error happened. Please check the Console tab of Developer tools.',
        );
      }
    }
  }

  get projects(): string[] {
    if (isCheWorkspace(this.workspace)) {
      return (this.workspace.devfile.projects || []).map(project => project.name);
    } else {
      return (this.workspace.spec.template.projects || []).map(project => project.name);
    }
  }
}

export function constructWorkspace<T extends che.Workspace | devfileApi.DevWorkspace>(
  workspace: T,
): Workspace {
  return new WorkspaceAdapter(workspace);
}

export function isCheWorkspace(
  workspace: che.Workspace | devfileApi.DevWorkspace,
): workspace is che.Workspace {
  return (
    (workspace as che.Workspace).id !== undefined &&
    (workspace as che.Workspace).devfile !== undefined &&
    (workspace as che.Workspace).status !== undefined
  );
}

export function isCheDevfile(devfile: Devfile): devfile is che.WorkspaceDevfile {
  return !isDevfileV2(devfile);
}
