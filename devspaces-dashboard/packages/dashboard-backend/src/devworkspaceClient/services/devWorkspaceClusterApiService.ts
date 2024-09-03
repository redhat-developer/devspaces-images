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

import { V1alpha2DevWorkspace } from '@devfile/api';
import { devworkspaceGroup, devworkspaceLatestVersion, devworkspacePlural } from '@devfile/api/api';
import { api } from '@eclipse-che/common';
import * as k8s from '@kubernetes/client-node';
import { V1Status } from '@kubernetes/client-node';
import http from 'http';

import { prepareCustomObjectWatch } from '@/devworkspaceClient/services/helpers/prepareCustomObjectWatch';
import { ServerConfigApiService } from '@/devworkspaceClient/services/serverConfigApi';
import { IDevWorkspaceClusterApi } from '@/devworkspaceClient/types';
import { logger } from '@/utils/logger';

export class DevWorkspaceClusterApiService implements IDevWorkspaceClusterApi {
  private readonly serverConfigApiService: ServerConfigApiService;
  private readonly customObjectWatch: k8s.Watch;

  // This is a Set of identifiers of running DevWorkspaces.
  private runningDevWorkspaceIds: Set<string> = new Set();
  private watcherInProgress = false;

  constructor(kc: k8s.KubeConfig) {
    this.serverConfigApiService = new ServerConfigApiService(kc);
    this.customObjectWatch = prepareCustomObjectWatch(kc);
  }

  async isRunningWorkspacesClusterLimitExceeded(): Promise<boolean> {
    // Ensure that we are watching DevWorkspaces in all namespaces.
    await this.watchInAllNamespaces();

    const runningWorkspacesClusterLimit = await this.getRunningWorkspacesClusterLimit();
    if (runningWorkspacesClusterLimit === -1) {
      return false;
    }

    return this.getNumberOfRunningWorkspaces() >= runningWorkspacesClusterLimit;
  }

  async watchInAllNamespaces(): Promise<void> {
    if (this.watcherInProgress) {
      return;
    }

    logger.info('Start watching DevWorkspaces objects in all namespaces.');
    this.watcherInProgress = true;

    const path = `/apis/${devworkspaceGroup}/${devworkspaceLatestVersion}/watch/${devworkspacePlural}`;
    const queryParams = { watch: true };

    const request: http.ServerResponse = await this.customObjectWatch.watch(
      path,
      queryParams,
      (eventPhase: string, apiObj: V1alpha2DevWorkspace | V1Status) => {
        this.handleWatchMessage(eventPhase, apiObj);
      },
      (error: unknown) => {
        this.handleWatchError(error, path);
        request.destroy();
        this.watcherInProgress = false;
      },
    );
  }

  private handleWatchMessage(
    eventPhase: string,
    apiObj: V1alpha2DevWorkspace | k8s.V1Status,
  ): void {
    switch (eventPhase) {
      case api.webSocket.EventPhase.ADDED:
      case api.webSocket.EventPhase.MODIFIED: {
        const devWorkspace = apiObj as V1alpha2DevWorkspace;
        if (this.isDevWorkspaceHasId(devWorkspace)) {
          if (this.isDevWorkspaceRunning(devWorkspace)) {
            this.runningDevWorkspaceIds.add(devWorkspace.status!.devworkspaceId);
          } else {
            this.runningDevWorkspaceIds.delete(devWorkspace.status!.devworkspaceId);
          }
        }
        break;
      }
      case api.webSocket.EventPhase.DELETED: {
        const devWorkspace = apiObj as V1alpha2DevWorkspace;
        if (this.isDevWorkspaceHasId(devWorkspace)) {
          this.runningDevWorkspaceIds.delete(devWorkspace.status!.devworkspaceId);
        }
        break;
      }
      case api.webSocket.EventPhase.ERROR: {
        const status = apiObj as V1Status;
        logger.info(`Watching DevWorkspace ERROR phase: ${status.message}`);
        break;
      }
    }
  }

  private handleWatchError(error: unknown, path: string): void {
    logger.warn(error, `Stopped watching ${path}.`);
  }

  private getNumberOfRunningWorkspaces(): number {
    return this.runningDevWorkspaceIds.size;
  }

  private async getRunningWorkspacesClusterLimit(): Promise<number> {
    const cheCustomResource = await this.serverConfigApiService.fetchCheCustomResource();
    return this.serverConfigApiService.getRunningWorkspacesClusterLimit(cheCustomResource);
  }

  private isDevWorkspaceRunning(devWorkspace: V1alpha2DevWorkspace): boolean {
    return devWorkspace.status?.phase === 'Running' || devWorkspace.status?.phase === 'Starting';
  }

  private isDevWorkspaceHasId(devWorkspace: V1alpha2DevWorkspace): boolean {
    return !!devWorkspace.status?.devworkspaceId;
  }
}
