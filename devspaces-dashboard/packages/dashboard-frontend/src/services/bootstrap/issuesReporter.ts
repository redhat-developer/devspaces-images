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

import { injectable } from 'inversify';

export type Warning = {
  key: string;
  title: string;
};

export type IssueType =
  | 'namespaceProvisioningError'
  | 'sessionExpired'
  | 'sso'
  | 'workspaceInactive'
  | 'workspaceRunTimeout'
  | 'workspaceStoppedError'
  | 'workspaceStopped'
  | 'unknown';
export type Issue = {
  type: IssueType;
  error: Error;
  data?: WorkspaceData;
};

export type WorkspaceData = {
  ideLoaderPath: string;
  workspaceDetailsPath: string;
  timeout?: number;
};

@injectable()
export class IssuesReporterService {
  private issues: Issue[] = [];

  public get hasIssue(): boolean {
    return this.issues.length !== 0;
  }

  public registerIssue(type: IssueType, error: Error, data?: WorkspaceData): void {
    this.issues.push({ type, error, data });
  }

  public reportIssue(): Issue | undefined {
    if (!this.hasIssue) {
      return undefined;
    }
    return this.issues[this.issues.length - 1];
  }

  public reportAllIssues(): Issue[] {
    return this.issues;
  }

  public clearIssues(): void {
    this.issues = [];
  }
}
