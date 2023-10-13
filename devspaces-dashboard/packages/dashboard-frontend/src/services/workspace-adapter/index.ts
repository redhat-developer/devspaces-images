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

import devfileApi, { isDevfileV2, isDevWorkspace } from '@/services/devfileApi';
import { DEVWORKSPACE_UPDATING_TIMESTAMP_ANNOTATION } from '@/services/devfileApi/devWorkspace/metadata';
import { DEVWORKSPACE_STORAGE_TYPE_ATTR } from '@/services/devfileApi/devWorkspace/spec/template';
import {
  DeprecatedWorkspaceStatus,
  DevWorkspaceStatus,
  WorkspaceStatus,
} from '@/services/helpers/types';
import {
  devfileToDevWorkspace,
  devWorkspaceToDevfile,
} from '@/services/workspace-client/devworkspace/converters';
import { DEVWORKSPACE_NEXT_START_ANNOTATION } from '@/services/workspace-client/devworkspace/devWorkspaceClient';

export interface Workspace {
  readonly ref: devfileApi.DevWorkspace;

  readonly id: string;
  readonly uid: string;
  name: string;
  readonly namespace: string;
  readonly infrastructureNamespace: string;
  readonly created: number;
  readonly updated: number;
  status: WorkspaceStatus | DevWorkspaceStatus | DeprecatedWorkspaceStatus;
  readonly ideUrl?: string;
  devfile: devfileApi.Devfile;
  storageType: che.WorkspaceStorageType;
  readonly projects: string[];
  readonly isStarting: boolean;
  readonly isStopped: boolean;
  readonly isStopping: boolean;
  readonly isRunning: boolean;
  readonly hasError: boolean;
  readonly error: string | undefined;
  readonly isDevWorkspace: boolean;
  readonly isDeprecated: boolean;
}

export class WorkspaceAdapter<T extends devfileApi.DevWorkspace> implements Workspace {
  private static deprecatedUIDs: string[] = [];
  private readonly workspace: T;

  constructor(workspace: T) {
    if (isDevWorkspace(workspace)) {
      this.workspace = workspace;
    } else {
      console.error('Unexpected workspace object shape:', workspace);
      throw new Error('Unexpected workspace object shape.');
    }
  }

  static setDeprecatedUIDs(UIDs: string[]) {
    WorkspaceAdapter.deprecatedUIDs = UIDs;
  }

  static isDeprecated(workspace: devfileApi.DevWorkspace): boolean {
    if (isDevWorkspace(workspace)) {
      return false;
    } else {
      return true;
    }
  }

  /**
   * Returns a workspace ID.
   * Note that IDs may intersect for Che7 workspaces and DevWorkspaces.
   */
  static getId(workspace: devfileApi.DevWorkspace): string {
    if (workspace.status?.devworkspaceId) {
      return workspace.status.devworkspaceId;
    }
    return 'workspace' + workspace.metadata.uid.split('-').splice(0, 3).join('');
  }

  /**
   * Returns a unique workspace ID.
   */
  static getUID(workspace: devfileApi.DevWorkspace): string {
    return workspace.metadata.uid;
  }

  static getStatus(
    workspace: devfileApi.DevWorkspace,
  ): DevWorkspaceStatus | DeprecatedWorkspaceStatus {
    if (WorkspaceAdapter.isDeprecated(workspace)) {
      return 'Deprecated';
    }
    if (!workspace.status?.phase) {
      return workspace.spec.started ? DevWorkspaceStatus.STARTING : DevWorkspaceStatus.STOPPED;
    }

    return workspace.status.phase as DevWorkspaceStatus;
  }

  static buildClusterConsoleUrl(
    workspace: devfileApi.DevWorkspace,
    clusterConsoleUrl: string,
  ): string {
    const workspaceName = workspace.metadata.name;
    const userNamespace = workspace.metadata.namespace;
    const resourcePath = workspace.apiVersion.replace('/', '~') + '~' + workspace.kind;

    return `${clusterConsoleUrl}/k8s/ns/${userNamespace}/${resourcePath}/${workspaceName}`;
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
    return this.workspace.metadata.name;
  }

  set name(name: string) {
    console.error('Not implemented: set name of the devworkspace.');
  }

  get namespace(): string {
    return this.workspace.metadata.namespace;
  }

  get isDevWorkspace(): boolean {
    return isDevWorkspace(this.workspace);
  }

  get infrastructureNamespace(): string {
    return this.workspace.metadata.namespace;
  }

  /**
   * Returns a workspace creation time in ms
   */
  get created(): number {
    if (this.workspace.metadata.creationTimestamp) {
      // `creationTimestamp` is a date time String
      return new Date(this.workspace.metadata.creationTimestamp).getTime();
    }
    return new Date().getTime();
  }

  /**
   * Returns a workspace last updated time in ms
   */
  get updated(): number {
    const updated =
      this.workspace.metadata.annotations?.[DEVWORKSPACE_UPDATING_TIMESTAMP_ANNOTATION];
    if (updated) {
      return new Date(updated).getTime();
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
    return WorkspaceAdapter.getStatus(this.workspace) === DevWorkspaceStatus.STARTING;
  }

  get isStopped(): boolean {
    return WorkspaceAdapter.getStatus(this.workspace) === DevWorkspaceStatus.STOPPED;
  }

  get isStopping(): boolean {
    return WorkspaceAdapter.getStatus(this.workspace) === DevWorkspaceStatus.STOPPING;
  }

  get isRunning(): boolean {
    return WorkspaceAdapter.getStatus(this.workspace) === DevWorkspaceStatus.RUNNING;
  }

  get hasError(): boolean {
    const devWorkspaceStatus = WorkspaceAdapter.getStatus(this.workspace);
    return (
      devWorkspaceStatus === DevWorkspaceStatus.FAILED ||
      devWorkspaceStatus === DevWorkspaceStatus.FAILING
    );
  }

  get error(): string | undefined {
    if (this.hasError === false) {
      return;
    }
    return this.workspace.status?.message;
  }

  get ideUrl(): string | undefined {
    return this.workspace.status?.mainUrl;
  }

  get storageType(): che.WorkspaceStorageType {
    return (this.workspace.spec.template?.attributes?.[DEVWORKSPACE_STORAGE_TYPE_ATTR] ||
      '') as che.WorkspaceStorageType;
  }

  set storageType(type: che.WorkspaceStorageType) {
    if (type) {
      if (!this.workspace.spec.template.attributes) {
        this.workspace.spec.template.attributes = {};
      }
      this.workspace.spec.template.attributes[DEVWORKSPACE_STORAGE_TYPE_ATTR] = type;
    } else {
      if (this.workspace.spec.template.attributes?.[DEVWORKSPACE_STORAGE_TYPE_ATTR]) {
        delete this.workspace.spec.template.attributes[DEVWORKSPACE_STORAGE_TYPE_ATTR];
        if (Object.keys(this.workspace.spec.template.attributes).length === 0) {
          delete this.workspace.spec.template.attributes;
        }
      }
    }
  }

  get devfile(): devfileApi.Devfile {
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

  set devfile(devfile: devfileApi.Devfile) {
    const plugins = this.workspace.spec.contributions || [];
    const converted = devfileToDevWorkspace(
      devfile as devfileApi.Devfile,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.workspace.spec.routingClass!,
      this.workspace.spec.started,
    );
    if (converted.spec.contributions === undefined) {
      converted.spec.contributions = [];
    }
    converted.spec.contributions.push(...plugins);
    (this.workspace as devfileApi.DevWorkspace) = converted;
  }

  get projects(): string[] {
    return (this.workspace.spec.template.projects || []).map(project => project.name);
  }
}

export function constructWorkspace<T extends devfileApi.DevWorkspace>(workspace: T): Workspace {
  return new WorkspaceAdapter(workspace);
}

export function isCheDevfile(devfile: unknown): devfile is che.WorkspaceDevfile {
  return !isDevfileV2(devfile);
}
