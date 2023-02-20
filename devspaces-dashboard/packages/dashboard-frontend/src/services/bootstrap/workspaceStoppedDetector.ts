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

import { AppState } from '../../store';
import { selectAllWorkspaces } from '../../store/Workspaces/selectors';
import { injectable } from 'inversify';
import devfileApi from '../devfileApi';
import { DevWorkspaceStatus } from '../helpers/types';
import SessionStorageService, { SessionStorageKey } from '../session-storage';
import { Workspace } from '../workspace-adapter';
import { IssueType } from './issuesReporter';

export class WorkspaceRunningError extends Error {
  public workspace: Workspace;

  /**
   * Check if workspace is running or is about to run.
   * If it is, throw error.
   *
   * @param workspace the workspace to check
   */
  public static throwIfNeeded(workspace) {
    if (workspace.isRunning || workspace.isStarting) {
      const state = workspace.isRunning ? 'running' : 'starting';
      throw new WorkspaceRunningError(`The workspace is ${state}.`, workspace);
    }
  }

  constructor(message: string, workspace: Workspace) {
    super(message);
    this.name = 'WorkspaceRunningError';
    this.workspace = workspace;
  }
}

/**
 * The dashboard can be reached when redirected from a workspace url when the workspace itself is not running.
 * See https://github.com/eclipse-che/che-operator/pull/1392.
 *
 * WorkspaceStoppedDetector detects this case by checking the original url
 * (ex. the workspace url) from SessionStorage, clears SessionStorage, and determines
 * the reason the workspace is not running.
 */
@injectable()
export class WorkspaceStoppedDetector {
  private static STOPPED_BY_ANNOTATION = 'controller.devfile.io/stopped-by';

  /**
   * Checks if the dashboard has been reached from a workspace url.
   * This would happen if the workspace url is accessed when the workspace has stopped.
   * If this is the case, this function returns the workspace.
   * Else, returns undefined.
   *
   * @param state the current app state
   * @returns the non-running (stopped) workspace
   */
  public checkWorkspaceStopped(state: AppState): Workspace | undefined {
    if (!this.isRedirectedFromNonDashboardUrl()) {
      return;
    }
    const path = SessionStorageService.remove(SessionStorageKey.ORIGINAL_LOCATION_PATH);
    if (!path) {
      return;
    }
    const workspace = selectAllWorkspaces(state).find(w => w.ideUrl?.includes(path));
    if (!workspace) {
      return;
    }

    WorkspaceRunningError.throwIfNeeded(workspace);

    return workspace;
  }

  /**
   * Returns an appropriate Error for the stopped workspace's issueType
   * @param workspace the stopped workspace
   * @param issueType the reason the workspace has stopped
   * @returns an appropriate Error describing the stopped workspace if applicable
   */
  public getWorkspaceStoppedError(workspace: Workspace, issueType: IssueType): Error {
    WorkspaceRunningError.throwIfNeeded(workspace);

    if (issueType === 'workspaceStoppedError') {
      const devworkspace = workspace.ref as devfileApi.DevWorkspace;
      if (devworkspace.status?.message) {
        return new Error(devworkspace.status?.message);
      }
    }

    // no specific error message in the other cases
    return new Error();
  }

  /**
   * Returns the reason the provided workspace has stopped
   * @param workspace the stopped workspace
   * @returns the reason why the workspace has stopped
   */
  public getWorkspaceStoppedIssueType(workspace: Workspace): IssueType {
    WorkspaceRunningError.throwIfNeeded(workspace);

    const devworkspace = workspace.ref as devfileApi.DevWorkspace;

    const workspaceAnnotations = devworkspace.metadata?.annotations;

    if (workspaceAnnotations) {
      if (workspaceAnnotations[WorkspaceStoppedDetector.STOPPED_BY_ANNOTATION] === 'inactivity') {
        return 'workspaceInactive';
      }

      if (workspaceAnnotations[WorkspaceStoppedDetector.STOPPED_BY_ANNOTATION] === 'run-timeout') {
        return 'workspaceRunTimeout';
      }
    }

    if (workspace.status === DevWorkspaceStatus.FAILED && devworkspace.status?.message) {
      return 'workspaceStoppedError';
    }

    return 'workspaceStopped';
  }

  /**
   * Returns true if the dashboard was reached via redirection from a url path that was not:
   * 1. /
   * 2. /dashboard/
   */
  private isRedirectedFromNonDashboardUrl(): boolean {
    const path = SessionStorageService.get(SessionStorageKey.ORIGINAL_LOCATION_PATH);
    if (!path) {
      return false;
    }
    return path !== '/' && path !== '/dashboard';
  }
}
